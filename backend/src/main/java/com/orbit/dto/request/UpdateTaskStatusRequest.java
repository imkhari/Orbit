package com.orbit.dto.request;

import com.orbit.entity.Task;
import jakarta.validation.constraints.NotNull;

/**
 * DTO cập nhật trạng thái cột Kanban cho nhiệm vụ.
 */
public record UpdateTaskStatusRequest(
    @NotNull(message = "Trạng thái nhiệm vụ là bắt buộc (BACKLOG, TODO, DOING, DONE)")
    Task.TaskStatus status
) {}
