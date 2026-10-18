package com.orbit.service;

import com.orbit.dto.request.CreateTaskRequest;
import com.orbit.dto.request.UpdateTaskStatusRequest;
import com.orbit.dto.response.TaskResponse;
import com.orbit.entity.Task;
import com.orbit.entity.User;
import com.orbit.exception.WipLimitExceededException;
import com.orbit.repository.TaskRepository;
import com.orbit.repository.UserRepository;
import com.orbit.service.impl.TaskServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TaskServiceImpl taskService;

    private User mockUser;
    private Task mockTask;

    @BeforeEach
    void setUp() {
        mockUser = User.builder()
            .id(UUID.randomUUID())
            .email("demo@orbit.app")
            .displayName("ADHD Explorer")
            .build();

        mockTask = Task.builder()
            .id(UUID.randomUUID())
            .user(mockUser)
            .title("Soạn thảo slide bài tập lớn")
            .description("Làm 10 slide cho đồ án")
            .status(Task.TaskStatus.TODO)
            .energyRequired(Task.EnergyRequirement.MEDIUM)
            .urgency(Task.UrgencyLevel.HIGH)
            .estimatedMinutes(30)
            .createdAt(Instant.now())
            .build();
    }

    @Test
    @DisplayName("Tạo mới nhiệm vụ thành công vào cột Backlog")
    void createTask_Success() {
        CreateTaskRequest request = new CreateTaskRequest(
            "Soạn thảo slide bài tập lớn",
            "Làm 10 slide",
            Task.EnergyRequirement.HIGH,
            30,
            Task.UrgencyLevel.HIGH,
            mockUser.getId()
        );

        when(userRepository.findById(mockUser.getId())).thenReturn(Optional.of(mockUser));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> {
            Task t = invocation.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });

        TaskResponse response = taskService.createTask(request);

        assertThat(response).isNotNull();
        assertThat(response.title()).isEqualTo("Soạn thảo slide bài tập lớn");
        assertThat(response.status()).isEqualTo(Task.TaskStatus.BACKLOG);
        verify(taskRepository, times(1)).save(any(Task.class));
    }

    @Test
    @DisplayName("Chuyển trạng thái sang DOING thành công khi chưa có task nào đang làm (WIP = 0)")
    void updateTaskStatus_Doing_Success() {
        UpdateTaskStatusRequest request = new UpdateTaskStatusRequest(Task.TaskStatus.DOING);

        when(taskRepository.findById(mockTask.getId())).thenReturn(Optional.of(mockTask));
        when(taskRepository.countByUserIdAndStatus(mockUser.getId(), Task.TaskStatus.DOING)).thenReturn(0L);
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TaskResponse response = taskService.updateTaskStatus(mockTask.getId(), request);

        assertThat(response.status()).isEqualTo(Task.TaskStatus.DOING);
        verify(taskRepository, times(1)).save(mockTask);
    }

    @Test
    @DisplayName("Ném WipLimitExceededException khi cố tình chuyển task thứ 2 sang DOING (WIP >= 1)")
    void updateTaskStatus_Doing_ThrowsWipLimitExceededException() {
        UpdateTaskStatusRequest request = new UpdateTaskStatusRequest(Task.TaskStatus.DOING);

        when(taskRepository.findById(mockTask.getId())).thenReturn(Optional.of(mockTask));
        when(taskRepository.countByUserIdAndStatus(mockUser.getId(), Task.TaskStatus.DOING)).thenReturn(1L);

        assertThatThrownBy(() -> taskService.updateTaskStatus(mockTask.getId(), request))
            .isInstanceOf(WipLimitExceededException.class)
            .hasMessageContaining("Đơn nhiệm là siêu năng lực của bạn");

        verify(taskRepository, never()).save(any(Task.class));
    }

    @Test
    @DisplayName("Chuyển trạng thái sang DONE sẽ cập nhật completedAt")
    void updateTaskStatus_Done_SetsCompletedAt() {
        UpdateTaskStatusRequest request = new UpdateTaskStatusRequest(Task.TaskStatus.DONE);

        when(taskRepository.findById(mockTask.getId())).thenReturn(Optional.of(mockTask));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TaskResponse response = taskService.updateTaskStatus(mockTask.getId(), request);

        assertThat(response.status()).isEqualTo(Task.TaskStatus.DONE);
        assertThat(response.completedAt()).isNotNull();
    }
}
