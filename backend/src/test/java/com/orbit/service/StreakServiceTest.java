package com.orbit.service;

import com.orbit.dto.response.StreakResponse;
import com.orbit.entity.StreakHistory;
import com.orbit.entity.User;
import com.orbit.repository.StreakHistoryRepository;
import com.orbit.repository.UserRepository;
import com.orbit.service.impl.StreakServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StreakServiceTest {

    @Mock
    private StreakHistoryRepository streakHistoryRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private StreakServiceImpl streakService;

    private User mockUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        mockUser = User.builder()
                .id(userId)
                .email("demo@orbit.app")
                .displayName("ADHD Explorer")
                .build();
    }

    @Test
    @DisplayName("Cộng XP vi mô và tính toán Level chính xác theo công thức PRD (Zero Penalty)")
    void recordActivity_AccumulatesXpAndCalculatesLevel() {
        StreakHistory history = StreakHistory.builder()
                .user(mockUser)
                .currentStreak(1)
                .longestStreak(1)
                .freezeCredits(1)
                .totalXp(0)
                .currentLevel(1)
                .lastActiveDate(LocalDate.now())
                .streakState(StreakHistory.StreakState.ACTIVE)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(streakHistoryRepository.findByUserId(userId)).thenReturn(Optional.of(history));
        when(streakHistoryRepository.save(any(StreakHistory.class))).thenAnswer(i -> i.getArgument(0));

        // Hoàn thành 1 task: +10 XP
        StreakResponse response = streakService.recordActivity(userId, 10);
        assertThat(response.totalXp()).isEqualTo(10);
        assertThat(response.currentLevel()).isEqualTo(1); // floor(sqrt(10/50)) + 1 = 1

        // Tiếp tục tích lũy thêm 200 XP (tổng 210 XP) -> level = floor(sqrt(210/50)) + 1 = floor(sqrt(4.2)) + 1 = 2 + 1 = 3
        StreakResponse response2 = streakService.recordActivity(userId, 200);
        assertThat(response2.totalXp()).isEqualTo(210);
        assertThat(response2.currentLevel()).isEqualTo(3);
    }

    @Test
    @DisplayName("Duy trì chuỗi liên tiếp: Mỗi 3 ngày tặng thêm 1 Khiên Freeze (Tối đa 2 khiên)")
    void recordActivity_EarnsFreezeCreditEvery3Days() {
        StreakHistory history = StreakHistory.builder()
                .user(mockUser)
                .currentStreak(2) // Đã duy trì 2 ngày
                .longestStreak(2)
                .freezeCredits(1) // Đang có 1 khiên
                .totalXp(50)
                .currentLevel(2)
                .lastActiveDate(LocalDate.now().minusDays(1)) // Hôm qua vừa làm
                .streakState(StreakHistory.StreakState.ACTIVE)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(streakHistoryRepository.findByUserId(userId)).thenReturn(Optional.of(history));
        when(streakHistoryRepository.save(any(StreakHistory.class))).thenAnswer(i -> i.getArgument(0));

        // Hôm nay hoàn thành việc -> đạt mốc 3 ngày liên tiếp
        StreakResponse response = streakService.recordActivity(userId, 10);

        assertThat(response.currentStreak()).isEqualTo(3);
        assertThat(response.longestStreak()).isEqualTo(3);
        // Được tặng thêm 1 khiên: 1 + 1 = 2 khiên
        assertThat(response.freezeCredits()).isEqualTo(2);

        // Giả lập tiếp tục đạt mốc 6 ngày, nhưng số khiên đã đạt trần tối đa 2
        history.setCurrentStreak(5);
        history.setLastActiveDate(LocalDate.now().minusDays(1));
        StreakResponse response6Days = streakService.recordActivity(userId, 10);

        assertThat(response6Days.currentStreak()).isEqualTo(6);
        // Vẫn giữ tối đa 2 khiên
        assertThat(response6Days.freezeCredits()).isEqualTo(2);
    }

    @Test
    @DisplayName("Edge Case 03: Tự động tiêu thụ Khiên Freeze khi bỏ lỡ ngày hôm qua, bảo lưu chuỗi ngày")
    void evaluateFreeze_ConsumesShieldAndPreservesStreak() {
        // Người dùng đã làm việc từ 2 ngày trước (bỏ lỡ ngày hôm qua), đang có 1 khiên
        StreakHistory history = StreakHistory.builder()
                .user(mockUser)
                .currentStreak(7)
                .longestStreak(10)
                .freezeCredits(1)
                .totalXp(120)
                .currentLevel(2)
                .lastActiveDate(LocalDate.now().minusDays(2))
                .streakState(StreakHistory.StreakState.ACTIVE)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(streakHistoryRepository.findByUserId(userId)).thenReturn(Optional.of(history));
        when(streakHistoryRepository.save(any(StreakHistory.class))).thenAnswer(i -> i.getArgument(0));

        StreakResponse response = streakService.getUserStreak(userId);

        // Kiểm tra cơ chế tha thứ: Trừ 1 khiên (1 -> 0), chuyển trạng thái FROZEN, giữ nguyên 7 ngày!
        assertThat(response.freezeCredits()).isEqualTo(0);
        assertThat(response.streakState()).isEqualTo(StreakHistory.StreakState.FROZEN);
        assertThat(response.currentStreak()).isEqualTo(7);
        assertThat(response.isFrozenToday()).isTrue();
        assertThat(response.gentleMessage()).contains("Khiên Đóng Băng đã tự động bảo vệ");

        verify(streakHistoryRepository, times(1)).save(history);
    }

    @Test
    @DisplayName("Edge Case 04: Cạn khiên sau nhiều ngày vắng mặt -> Reset chuỗi về 0 nhưng giữ nguyên XP và kỷ lục")
    void evaluateFreeze_ExhaustedShields_ResetsStreakGently() {
        // Người dùng vắng mặt từ 4 ngày trước và đã hết khiên (0 khiên)
        StreakHistory history = StreakHistory.builder()
                .user(mockUser)
                .currentStreak(15)
                .longestStreak(15)
                .freezeCredits(0)
                .totalXp(350)
                .currentLevel(3)
                .lastActiveDate(LocalDate.now().minusDays(4))
                .streakState(StreakHistory.StreakState.ACTIVE)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(streakHistoryRepository.findByUserId(userId)).thenReturn(Optional.of(history));
        when(streakHistoryRepository.save(any(StreakHistory.class))).thenAnswer(i -> i.getArgument(0));

        StreakResponse response = streakService.getUserStreak(userId);

        // Chuỗi bị reset về 0 nhưng điểm kinh nghiệm và kỷ lục dài nhất được bảo toàn 100%
        assertThat(response.currentStreak()).isEqualTo(0);
        assertThat(response.longestStreak()).isEqualTo(15);
        assertThat(response.totalXp()).isEqualTo(350);
        assertThat(response.currentLevel()).isEqualTo(3);
        assertThat(response.streakState()).isEqualTo(StreakHistory.StreakState.RESET);
        assertThat(response.gentleMessage()).contains("Mừng bạn trở lại");
    }
}
