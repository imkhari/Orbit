package com.orbit.dto.response;

import com.orbit.entity.Subtask;
import com.orbit.entity.Task;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO trả về thông tin vi bước (Subtask) cho Client.
 */
public record SubtaskResponse(
        UUID id,
        UUID taskId,
        String title,
        Integer estimatedMinutes,
        Task.EnergyRequirement energyLevel,
        Integer stepOrder,
        Boolean isCompleted,
        Instant completedAt
) {
    public static SubtaskResponse fromEntity(Subtask subtask) {
        return new SubtaskResponse(
                subtask.getId(),
                subtask.getTask() != null ? subtask.getTask().getId() : null,
                subtask.getTitle(),
                subtask.getEstimatedMinutes(),
                subtask.getEnergyLevel(),
                subtask.getStepOrder(),
                Boolean.TRUE.equals(subtask.getIsCompleted()),
                subtask.getCompletedAt()
        );
    }
}
