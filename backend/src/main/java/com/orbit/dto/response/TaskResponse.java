package com.orbit.dto.response;

import com.orbit.entity.Task;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO trả về thông tin chi tiết nhiệm vụ cho Client kèm các thuộc tính công thái học nhận thức ADHD
 * (Điểm ưu tiên năng lượng P(T), cảnh báo quá hạn dịu dàng isOverdue, và hiệu ứng làm mờ isDimmed).
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
    Instant completedAt,
    Double priorityScore,
    Boolean isOverdue,
    Boolean isDimmed
) {
    public static TaskResponse fromEntity(Task task) {
        boolean overdue = task.getDeadline() != null
                && task.getDeadline().isBefore(Instant.now())
                && task.getStatus() != Task.TaskStatus.DONE;

        return fromEntity(task, null, overdue, false);
    }

    public static TaskResponse fromEntity(Task task, Double priorityScore, Boolean isOverdue, Boolean isDimmed) {
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
            task.getCompletedAt(),
            priorityScore,
            Boolean.TRUE.equals(isOverdue),
            Boolean.TRUE.equals(isDimmed)
        );
    }
}
