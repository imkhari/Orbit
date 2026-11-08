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
import org.mockito.Spy;
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

    @Mock
    private com.orbit.service.StreakService streakService;

    @Spy
    private com.orbit.service.engine.EnergyPrioritizationEngine energyPrioritizationEngine = new com.orbit.service.engine.EnergyPrioritizationEngine();

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
        verify(streakService, times(1)).recordActivity(mockUser.getId(), 10);
    }

    @Test
    @DisplayName("Edge Case 05: Dán văn bản cực dài (>255 ký tự) -> Tự động cắt <= 100 ký tự làm Title, phần còn lại đưa vào Description")
    void createTask_LongTitle_AutoSplitsTitleAndPrependDescription() {
        String longText = "Nghiên cứu kiến trúc vi dịch vụ và xử lý nhận thức ADHD: " +
                "Đây là một đoạn ghi chú cực dài mà người dùng dán nhầm vào ô tiêu đề Instant Capture. " +
                "Nội dung này bao gồm nhiều phân tích chi tiết về tâm lý học, phản ứng dopamine, và cách giảm tải nhận thức cho người dùng.";

        CreateTaskRequest request = new CreateTaskRequest(
                longText,
                "Ghi chú bổ sung ban đầu",
                Task.EnergyRequirement.HIGH,
                60,
                Task.UrgencyLevel.HIGH,
                mockUser.getId()
        );

        when(userRepository.findById(mockUser.getId())).thenReturn(Optional.of(mockUser));
        when(taskRepository.save(any(Task.class))).thenAnswer(i -> {
            Task t = i.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });

        TaskResponse response = taskService.createTask(request);

        assertThat(response).isNotNull();
        // Tiêu đề được cắt gọn gàng <= 100 ký tự
        assertThat(response.title().length()).isLessThanOrEqualTo(100);
        assertThat(response.title()).contains("Nghiên cứu kiến trúc");
        // Phần còn lại được đưa vào description
        assertThat(response.description()).contains("dán nhầm vào ô tiêu đề Instant Capture");
        assertThat(response.description()).contains("Ghi chú bổ sung ban đầu");
    }

    @Test
    @DisplayName("Edge Case 10: Chuyển task từ DONE ngược về TODO -> Giữ nguyên số điểm XP cũ (Zero Penalty)")
    void updateTaskStatus_DoneToTodo_PreservesXpWithoutPenalty() {
        mockTask.setStatus(Task.TaskStatus.DONE);
        mockTask.setCompletedAt(Instant.now());

        UpdateTaskStatusRequest request = new UpdateTaskStatusRequest(Task.TaskStatus.TODO);

        when(taskRepository.findById(mockTask.getId())).thenReturn(Optional.of(mockTask));
        when(taskRepository.save(any(Task.class))).thenAnswer(i -> i.getArgument(0));

        TaskResponse response = taskService.updateTaskStatus(mockTask.getId(), request);

        assertThat(response.status()).isEqualTo(Task.TaskStatus.TODO);
        assertThat(response.completedAt()).isNull();

        // Đảm bảo không gọi trừ điểm hay phạt người dùng
        verify(streakService, never()).recordActivity(eq(mockUser.getId()), intThat(xp -> xp < 0));
    }
}
