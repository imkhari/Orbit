package com.orbit.service.impl;

import com.orbit.dto.request.BulkSubtasksRequest;
import com.orbit.dto.response.SubtaskResponse;
import com.orbit.dto.response.TaskResponse;
import com.orbit.entity.Subtask;
import com.orbit.entity.Task;
import com.orbit.exception.ResourceNotFoundException;
import com.orbit.repository.SubtaskRepository;
import com.orbit.repository.TaskRepository;
import com.orbit.service.SubtaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubtaskServiceImpl implements SubtaskService {

    private final TaskRepository taskRepository;
    private final SubtaskRepository subtaskRepository;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TaskResponse saveBulkSubtasks(UUID taskId, BulkSubtasksRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Nhiệm vụ không tồn tại với ID: " + taskId));

        log.info("Saving {} bulk subtasks for task ID: {}", request.subtasks().size(), taskId);

        // Xóa các bước cũ nếu có để thay thế bằng danh sách mới đã được người dùng phê duyệt
        task.getSubtasks().clear();

        int defaultOrder = 1;
        for (BulkSubtasksRequest.SubtaskItemRequest item : request.subtasks()) {
            Subtask subtask = Subtask.builder()
                    .task(task)
                    .title(item.title().trim())
                    .estimatedMinutes(item.estimatedMinutes() != null ? item.estimatedMinutes() : 15)
                    .energyLevel(item.energyLevel() != null ? item.energyLevel() : Task.EnergyRequirement.LOW)
                    .stepOrder(item.stepOrder() != null ? item.stepOrder() : defaultOrder++)
                    .isCompleted(Boolean.TRUE.equals(item.isCompleted()))
                    .completedAt(Boolean.TRUE.equals(item.isCompleted()) ? Instant.now() : null)
                    .build();

            task.getSubtasks().add(subtask);
        }

        Task savedTask = taskRepository.save(task);
        log.info("Bulk subtasks saved successfully for task ID: {}. Total subtasks: {}", taskId, savedTask.getSubtasks().size());

        return TaskResponse.fromEntity(savedTask);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SubtaskResponse toggleSubtask(UUID taskId, UUID subtaskId) {
        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new ResourceNotFoundException("Vi bước không tồn tại với ID: " + subtaskId));

        if (!subtask.getTask().getId().equals(taskId)) {
            throw new IllegalArgumentException("Vi bước ID " + subtaskId + " không thuộc về nhiệm vụ ID " + taskId);
        }

        boolean currentCompleted = Boolean.TRUE.equals(subtask.getIsCompleted());
        boolean newCompleted = !currentCompleted;

        subtask.setIsCompleted(newCompleted);
        subtask.setCompletedAt(newCompleted ? Instant.now() : null);

        Subtask updated = subtaskRepository.save(subtask);
        log.info("Toggled subtask ID: {} to isCompleted={}", subtaskId, newCompleted);

        return SubtaskResponse.fromEntity(updated);
    }

    @Override
    public List<SubtaskResponse> getSubtasksByTaskId(UUID taskId) {
        if (!taskRepository.existsById(taskId)) {
            throw new ResourceNotFoundException("Nhiệm vụ không tồn tại với ID: " + taskId);
        }

        return subtaskRepository.findByTaskIdOrderByStepOrderAsc(taskId).stream()
                .map(SubtaskResponse::fromEntity)
                .toList();
    }
}
