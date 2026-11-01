package com.orbit.service.impl;

import com.orbit.dto.response.StreakResponse;
import com.orbit.entity.StreakHistory;
import com.orbit.entity.User;
import com.orbit.repository.StreakHistoryRepository;
import com.orbit.repository.UserRepository;
import com.orbit.service.StreakService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StreakServiceImpl implements StreakService {

    private final StreakHistoryRepository streakHistoryRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public StreakResponse getUserStreak(UUID userId) {
        User user = resolveUser(userId);
        StreakHistory history = getOrCreateStreakHistory(user);

        LocalDate today = LocalDate.now();
        String message = evaluateAndApplyFreezeShield(history, today);

        return StreakResponse.fromEntity(history, message);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public StreakResponse recordActivity(UUID userId, int xpReward) {
        User user = resolveUser(userId);
        StreakHistory history = getOrCreateStreakHistory(user);

        LocalDate today = LocalDate.now();
        evaluateAndApplyFreezeShield(history, today);

        // 1. Cộng XP và tính toán lại level (Zero Penalty: không bao giờ trừ điểm)
        int validXp = Math.max(0, xpReward);
        history.setTotalXp(history.getTotalXp() + validXp);
        int newLevel = (int) Math.floor(Math.sqrt((double) history.getTotalXp() / 50.0)) + 1;
        history.setCurrentLevel(newLevel);

        // 2. Cập nhật chuỗi ngày (Streak)
        LocalDate lastActive = history.getLastActiveDate();
        if (lastActive == null) {
            history.setCurrentStreak(1);
            history.setLastActiveDate(today);
            history.setStreakState(StreakHistory.StreakState.ACTIVE);
        } else if (lastActive.equals(today)) {
            // Đã ghi nhận chuỗi cho ngày hôm nay, chỉ tích lũy thêm XP
            log.info("User {} already active today. XP rewarded: +{}", user.getId(), validXp);
        } else if (lastActive.equals(today.minusDays(1))) {
            // Hoạt động liên tiếp hôm qua (hoặc được khiên bảo vệ hôm qua)
            int newStreak = history.getCurrentStreak() + 1;
            history.setCurrentStreak(newStreak);

            // Cứ mỗi 3 ngày streak liên tiếp tặng 1 Khiên Đóng Băng (Tối đa sở hữu 2 khiên)
            if (newStreak % 3 == 0 && history.getFreezeCredits() < 2) {
                history.setFreezeCredits(history.getFreezeCredits() + 1);
                log.info("User {} earned 1 Streak Freeze Credit for 3-day continuous streak! Total credits: {}",
                        user.getId(), history.getFreezeCredits());
            }

            history.setLastActiveDate(today);
            history.setStreakState(StreakHistory.StreakState.ACTIVE);
        } else {
            // Chuỗi mới sau khi reset
            history.setCurrentStreak(1);
            history.setLastActiveDate(today);
            history.setStreakState(StreakHistory.StreakState.ACTIVE);
        }

        // Cập nhật kỷ lục chuỗi dài nhất
        if (history.getCurrentStreak() > history.getLongestStreak()) {
            history.setLongestStreak(history.getCurrentStreak());
        }

        history.setUpdatedAt(Instant.now());
        StreakHistory saved = streakHistoryRepository.save(history);

        String feedbackMsg = "Tuyệt vời! Bạn vừa nhận được +" + validXp + " XP! Chuỗi hiện tại: " + saved.getCurrentStreak() + " ngày 🔥";
        log.info("User {} recorded activity. Streak: {}, XP: {}, Level: {}",
                user.getId(), saved.getCurrentStreak(), saved.getTotalXp(), saved.getCurrentLevel());

        return StreakResponse.fromEntity(saved, feedbackMsg);
    }

    /**
     * Kiểm tra chu kỳ ngày và tự động kích hoạt Khiên Đóng Băng nếu bỏ lỡ ngày hôm qua (Edge Case 03 & 04).
     */
    String evaluateAndApplyFreezeShield(StreakHistory history, LocalDate today) {
        LocalDate lastActive = history.getLastActiveDate();

        if (lastActive == null) {
            return "Chào mừng bạn đến với Orbit! Hãy bắt đầu nhiệm vụ đầu tiên để nhóm ngọn lửa chuỗi ngày nhé! 🔥";
        }

        if (lastActive.equals(today)) {
            if (history.getStreakState() == StreakHistory.StreakState.FROZEN) {
                return "🛡️ Hôm nay bạn đã tiếp tục chuỗi thành công sau khi được Khiên Đóng Băng bảo vệ!";
            }
            return "Hôm nay bạn đã duy trì chuỗi thành công! Tiếp tục phát huy nhé! 🔥";
        }

        if (lastActive.equals(today.minusDays(1))) {
            return "Hãy hoàn thành một nhiệm vụ nhỏ hôm nay để tiếp tục chuỗi ngày tuyệt vời nhé! 🌿";
        }

        // Người dùng đã bỏ lỡ ít nhất 1 ngày (lastActive < yesterday)
        if (history.getFreezeCredits() > 0) {
            // Edge Case 03: Tự động tiêu thụ 1 khiên, bảo lưu nguyên vẹn chuỗi ngày!
            history.setFreezeCredits(history.getFreezeCredits() - 1);
            history.setStreakState(StreakHistory.StreakState.FROZEN);
            history.setLastActiveDate(today.minusDays(1)); // Đánh dấu ngày hôm qua được bảo hộ
            history.setUpdatedAt(Instant.now());
            streakHistoryRepository.save(history);

            log.info("Edge Case 03 triggered: Streak Freeze Shield consumed for user ID {}. Remaining credits: {}",
                    history.getUser().getId(), history.getFreezeCredits());

            return "🛡️ Khiên Đóng Băng đã tự động bảo vệ chuỗi ngày của bạn hôm qua. Hãy làm một việc nhỏ hôm nay để tiếp tục nhé!";
        } else {
            // Edge Case 04: Cạn kiệt khiên sau nhiều ngày vắng mặt -> Reset chuỗi về 0 nhưng giữ nguyên XP và kỷ lục
            history.setStreakState(StreakHistory.StreakState.RESET);
            history.setCurrentStreak(0);
            history.setUpdatedAt(Instant.now());
            streakHistoryRepository.save(history);

            log.info("Edge Case 04 triggered: Streak reset for user ID {} due to absence and exhausted freeze credits. XP preserved: {}",
                    history.getUser().getId(), history.getTotalXp());

            return "🌸 Mừng bạn trở lại! Cuộc sống luôn cần những quãng nghỉ. Mọi nỗ lực cũ của bạn vẫn luôn ở đây.";
        }
    }

    private StreakHistory getOrCreateStreakHistory(User user) {
        return streakHistoryRepository.findByUserId(user.getId()).orElseGet(() ->
            streakHistoryRepository.save(StreakHistory.builder()
                .user(user)
                .currentStreak(0)
                .longestStreak(0)
                .freezeCredits(1) // Mặc định sở hữu 1 Khiên Đóng Băng
                .streakState(StreakHistory.StreakState.ACTIVE)
                .totalXp(0)
                .currentLevel(1)
                .updatedAt(Instant.now())
                .build()
            )
        );
    }

    private User resolveUser(UUID userId) {
        if (userId != null) {
            return userRepository.findById(userId).orElseGet(this::getOrCreateDemoUser);
        }
        return getOrCreateDemoUser();
    }

    private User getOrCreateDemoUser() {
        return userRepository.findByEmail("demo@orbit.app").orElseGet(() ->
            userRepository.save(User.builder()
                .email("demo@orbit.app")
                .displayName("ADHD Explorer")
                .passwordHash("$2a$10$demoHashPlaceholderForOrbitDemoUser")
                .currentEnergyLevel(User.EnergyLevel.MEDIUM)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build()
            )
        );
    }
}
