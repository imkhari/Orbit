package com.orbit.service;

import com.orbit.dto.request.BulkSubtasksRequest;
import com.orbit.dto.request.BulkSubtasksRequest.SubtaskItemRequest;
import com.orbit.dto.response.SubtaskResponse;
import com.orbit.dto.response.TaskResponse;
import com.orbit.entity.Subtask;
import com.orbit.entity.Task;
import com.orbit.repository.SubtaskRepository;
import com.orbit.repository.TaskRepository;
import com.orbit.service.impl.SubtaskServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubtaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private SubtaskRepository subtaskRepository;

    @InjectMocks
    private SubtaskServiceImpl subtaskService;

    private Task testTask;
    private UUID taskId;

    @BeforeEach
    void setUp() {
        taskId = UUID.randomUUID();
        testTask = Task.builder()
                .id(taskId)
                .title("Làm đồ án tốt nghiệp Spring AI")
                .subtasks(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("Bulk Save: Lưu hàng loạt các vi bước vào DB và cập nhật số lượng subtasks của Task")
    void shouldSaveBulkSubtasksSuccessfully() {
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BulkSubtasksRequest request = new BulkSubtasksRequest(List.of(
                new SubtaskItemRequest("Mở file tài liệu đề cương", 4, Task.EnergyRequirement.LOW, 1, false),
                new SubtaskItemRequest("Phác thảo sơ đồ lớp", 15, Task.EnergyRequirement.MEDIUM, 2, false),
                new SubtaskItemRequest("Viết mã nguồn entity", 20, Task.EnergyRequirement.HIGH, 3, false)
        ));

        TaskResponse response = subtaskService.saveBulkSubtasks(taskId, request);

        assertThat(response).isNotNull();
        assertThat(response.subtaskCount()).isEqualTo(3);
        assertThat(response.completedSubtaskCount()).isEqualTo(0);
        assertThat(testTask.getSubtasks()).hasSize(3);
        assertThat(testTask.getSubtasks().get(0).getTitle()).isEqualTo("Mở file tài liệu đề cương");

        verify(taskRepository, times(1)).save(testTask);
    }

    @Test
    @DisplayName("Toggle Subtask: Đánh dấu vi bước sang hoàn thành và cập nhật completedAt")
    void shouldToggleSubtaskToCompleted() {
        UUID subtaskId = UUID.randomUUID();
        Subtask subtask = Subtask.builder()
                .id(subtaskId)
                .task(testTask)
                .title("Uống một ngụm nước để lấy năng lượng")
                .isCompleted(false)
                .build();

        when(subtaskRepository.findById(subtaskId)).thenReturn(Optional.of(subtask));
        when(subtaskRepository.save(any(Subtask.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SubtaskResponse response = subtaskService.toggleSubtask(taskId, subtaskId);

        assertThat(response.isCompleted()).isTrue();
        assertThat(response.completedAt()).isNotNull();

        // Toggle lại lần 2 -> chuyển về chưa hoàn thành
        SubtaskResponse response2 = subtaskService.toggleSubtask(taskId, subtaskId);
        assertThat(response2.isCompleted()).isFalse();
        assertThat(response2.completedAt()).isNull();
    }

    @Test
    @DisplayName("Get Subtasks: Lấy danh sách subtasks theo thứ tự stepOrder")
    void shouldGetSubtasksOrdered() {
        when(taskRepository.existsById(taskId)).thenReturn(true);
        when(subtaskRepository.findByTaskIdOrderByStepOrderAsc(taskId)).thenReturn(List.of(
                Subtask.builder().id(UUID.randomUUID()).task(testTask).title("Bước 1").stepOrder(1).build(),
                Subtask.builder().id(UUID.randomUUID()).task(testTask).title("Bước 2").stepOrder(2).build()
        ));

        List<SubtaskResponse> subtasks = subtaskService.getSubtasksByTaskId(taskId);

        assertThat(subtasks).hasSize(2);
        assertThat(subtasks.get(0).title()).isEqualTo("Bước 1");
        assertThat(subtasks.get(1).title()).isEqualTo("Bước 2");
    }
}
