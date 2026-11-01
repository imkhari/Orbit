package com.orbit.service;

import com.orbit.dto.request.LogFocusSessionRequest;
import com.orbit.dto.response.FocusSessionResponse;
import com.orbit.entity.FocusSession;
import com.orbit.entity.Task;
import com.orbit.entity.User;
import com.orbit.repository.FocusSessionRepository;
import com.orbit.repository.TaskRepository;
import com.orbit.repository.UserRepository;
import com.orbit.service.impl.FocusSessionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FocusSessionServiceTest {

    @Mock
    private FocusSessionRepository focusSessionRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StreakService streakService;

    @InjectMocks
    private FocusSessionServiceImpl focusSessionService;

    private User mockUser;
    private Task mockTask;
    private UUID userId;
    private UUID taskId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        taskId = UUID.randomUUID();

        mockUser = User.builder()
                .id(userId)
                .email("demo@orbit.app")
                .displayName("ADHD Explorer")
                .build();

        mockTask = Task.builder()
                .id(taskId)
                .title("Tập trung code Pomodoro")
                .user(mockUser)
                .build();
    }

    @Test
    @DisplayName("Hoàn thành đủ 25 phút Pomodoro: Ghi nhận thành công và tự động thưởng +15 XP")
    void logSession_Completed25Mins_Rewards15Xp() {
        LogFocusSessionRequest request = new LogFocusSessionRequest(taskId, 25, true);

        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(mockTask));
        when(focusSessionRepository.save(any(FocusSession.class))).thenAnswer(i -> {
            FocusSession session = i.getArgument(0);
            session.setId(UUID.randomUUID());
            return session;
        });

        FocusSessionResponse response = focusSessionService.logSession(userId, request);

        assertThat(response).isNotNull();
        assertThat(response.durationMinutes()).isEqualTo(25);
        assertThat(response.isCompleted()).isTrue();
        assertThat(response.earnedXp()).isEqualTo(15);
        assertThat(response.completedAt()).isNotNull();

        verify(streakService, times(1)).recordActivity(userId, 15);
    }

    @Test
    @DisplayName("Hủy phiên sớm (<25 phút): Không thưởng XP nhưng vẫn lưu an toàn (Zero Penalty)")
    void logSession_Incomplete_ZeroPenalty() {
        LogFocusSessionRequest request = new LogFocusSessionRequest(taskId, 10, false);

        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(mockTask));
        when(focusSessionRepository.save(any(FocusSession.class))).thenAnswer(i -> {
            FocusSession session = i.getArgument(0);
            session.setId(UUID.randomUUID());
            return session;
        });

        FocusSessionResponse response = focusSessionService.logSession(userId, request);

        assertThat(response.earnedXp()).isEqualTo(0);
        assertThat(response.isCompleted()).isFalse();

        verify(streakService, never()).recordActivity(any(), anyInt());
    }

    @Test
    @DisplayName("Lấy danh sách các phiên tập trung trong ngày")
    void getTodaySessions_ReturnsOrderedList() {
        FocusSession session1 = FocusSession.builder()
                .id(UUID.randomUUID())
                .user(mockUser)
                .task(mockTask)
                .durationMinutes(25)
                .isCompleted(true)
                .createdAt(Instant.now())
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(focusSessionRepository.findByUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(eq(userId), any(), any()))
                .thenReturn(List.of(session1));

        List<FocusSessionResponse> results = focusSessionService.getTodaySessions(userId);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).durationMinutes()).isEqualTo(25);
        assertThat(results.get(0).earnedXp()).isEqualTo(15);
    }
}
