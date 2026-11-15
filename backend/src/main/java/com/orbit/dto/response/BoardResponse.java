package com.orbit.dto.response;

import com.orbit.entity.Board;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO trả về thông tin bảng Kanban kèm số lượng tác vụ theo trạng thái.
 */
public record BoardResponse(
    UUID id,
    UUID userId,
    String title,
    String icon,
    String colorTheme,
    boolean isArchived,
    int position,
    long totalTasks,
    long doingTasks,
    long todoTasks,
    Instant createdAt,
    Instant updatedAt
) {
    public static BoardResponse fromEntity(Board board, long totalTasks, long doingTasks, long todoTasks) {
        return new BoardResponse(
            board.getId(),
            board.getUser() != null ? board.getUser().getId() : null,
            board.getTitle(),
            board.getIcon(),
            board.getColorTheme(),
            Boolean.TRUE.equals(board.getIsArchived()),
            board.getPosition() != null ? board.getPosition() : 0,
            totalTasks,
            doingTasks,
            todoTasks,
            board.getCreatedAt(),
            board.getUpdatedAt()
        );
    }
}
