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
import com.orbit.service.TaskOwnership;
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
    private final TaskOwnership ownership;
    private final SubtaskRepository subtaskRepository;
    private final com.orbit.service.StreakService streakService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TaskResponse saveBulkSubtasks(UUID taskId, BulkSubtasksRequest request) {
        Task task = ownership.require(taskId);

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

        Task savedTask = taskRepository.saveAndFlush(task);
        log.info("Bulk subtasks saved successfully for task ID: {}. Total subtasks: {}", taskId, savedTask.getSubtasks().size());

        return TaskResponse.fromEntity(savedTask);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SubtaskResponse toggleSubtask(UUID taskId, UUID subtaskId) {
        ownership.require(taskId);
        Subtask subtask = subtaskRepository.findByIdAndTaskId(subtaskId, taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Bước", subtaskId));

        boolean currentCompleted = Boolean.TRUE.equals(subtask.getIsCompleted());
        boolean newCompleted = !currentCompleted;

        subtask.setIsCompleted(newCompleted);
        subtask.setCompletedAt(newCompleted ? Instant.now() : null);

        Subtask updated = subtaskRepository.save(subtask);
        log.info("Toggled subtask ID: {} to isCompleted={}", subtaskId, newCompleted);

        // Quy tắc thưởng XP: Hoàn thành 1 vi bước nhận ngay +5 XP (Dopamine Ignition)
        if (newCompleted && subtask.getTask() != null && subtask.getTask().getUser() != null) {
            streakService.recordActivity(subtask.getTask().getUser().getId(), 5);
        }

        return SubtaskResponse.fromEntity(updated);
    }

    @Override
    public List<SubtaskResponse> getSubtasksByTaskId(UUID taskId) {
        ownership.require(taskId);

        return subtaskRepository.findByTaskIdOrderByStepOrderAsc(taskId).stream()
                .map(SubtaskResponse::fromEntity)
                .toList();
    }
}
