package com.orbit.service.impl;

import com.orbit.dto.request.LogFocusSessionRequest;
import com.orbit.dto.response.FocusSessionResponse;
import com.orbit.entity.FocusSession;
import com.orbit.entity.Task;
import com.orbit.entity.User;
import com.orbit.repository.FocusSessionRepository;
import com.orbit.repository.TaskRepository;
import com.orbit.repository.UserRepository;
import com.orbit.service.FocusSessionService;
import com.orbit.service.StreakService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FocusSessionServiceImpl implements FocusSessionService {

    private final FocusSessionRepository focusSessionRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final StreakService streakService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public FocusSessionResponse logSession(UUID userId, LogFocusSessionRequest request) {
        User user = resolveUser(userId);

        Task task = null;
        if (request.taskId() != null) {
            task = taskRepository.findById(request.taskId()).orElse(null);
        }

        boolean completed = Boolean.TRUE.equals(request.isCompleted());
        Instant completedAt = completed ? Instant.now() : null;

        FocusSession session = FocusSession.builder()
                .user(user)
                .task(task)
                .durationMinutes(request.durationMinutes())
                .isCompleted(completed)
                .completedAt(completedAt)
                .createdAt(Instant.now())
                .build();

        FocusSession saved = focusSessionRepository.save(session);
        log.info("Logged focus session ID: {} for user ID: {} ({} mins, completed: {})",
                saved.getId(), user.getId(), request.durationMinutes(), completed);

        // Quy tắc thưởng XP: Hoàn thành phiên Pomodoro (>= 25 phút) nhận ngay +15 XP
        int earnedXp = 0;
        if (completed && request.durationMinutes() >= 25) {
            earnedXp = 15;
            streakService.recordActivity(user.getId(), earnedXp);
            log.info("Rewarded +15 XP to user ID {} for completing 25-minute Pomodoro session", user.getId());
        }

        return FocusSessionResponse.fromEntity(saved, earnedXp);
    }

    @Override
    public List<FocusSessionResponse> getTodaySessions(UUID userId) {
        User user = resolveUser(userId);

        Instant startOfDay = LocalDate.now().atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant endOfDay = LocalDate.now().plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        return focusSessionRepository.findByUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(user.getId(), startOfDay, endOfDay)
                .stream()
                .map(s -> FocusSessionResponse.fromEntity(s, Boolean.TRUE.equals(s.getIsCompleted()) && s.getDurationMinutes() >= 25 ? 15 : 0))
                .toList();
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
