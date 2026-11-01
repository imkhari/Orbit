package com.orbit.dto.response;

import com.orbit.entity.FocusSession;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO trả về thông tin phiên tập trung đã được ghi nhận.
 */
public record FocusSessionResponse(
        UUID id,
        UUID taskId,
        String taskTitle,
        Integer durationMinutes,
        Boolean isCompleted,
        Integer earnedXp,
        Instant completedAt,
        Instant createdAt
) {
    public static FocusSessionResponse fromEntity(FocusSession session, int earnedXp) {
        return new FocusSessionResponse(
                session.getId(),
                session.getTask() != null ? session.getTask().getId() : null,
                session.getTask() != null ? session.getTask().getTitle() : null,
                session.getDurationMinutes(),
                Boolean.TRUE.equals(session.getIsCompleted()),
                earnedXp,
                session.getCompletedAt(),
                session.getCreatedAt()
        );
    }
}
