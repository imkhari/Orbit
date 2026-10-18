package com.orbit.dto.response;

import com.orbit.entity.Task;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO trả về thông tin chi tiết nhiệm vụ cho Client.
 */
public record TaskResponse(
    UUID id,
    UUID userId,
    String title,
    String description,
    Task.TaskStatus status,
    Task.UrgencyLevel urgency,
    Task.EnergyRequirement energyRequired,
    Integer estimatedMinutes,
    Integer position,
    int subtaskCount,
    int completedSubtaskCount,
    Instant deadline,
    Instant createdAt,
    Instant completedAt
) {
    public static TaskResponse fromEntity(Task task) {
        int subtaskCount = task.getSubtasks() != null ? task.getSubtasks().size() : 0;
        int completedCount = task.getSubtasks() != null ?
            (int) task.getSubtasks().stream().filter(s -> Boolean.TRUE.equals(s.getIsCompleted())).count() : 0;

        return new TaskResponse(
            task.getId(),
            task.getUser() != null ? task.getUser().getId() : null,
            task.getTitle(),
            task.getDescription(),
            task.getStatus(),
            task.getUrgency(),
            task.getEnergyRequired(),
            task.getEstimatedMinutes(),
            task.getPosition(),
            subtaskCount,
            completedCount,
            task.getDeadline(),
            task.getCreatedAt(),
            task.getCompletedAt()
        );
    }
}
