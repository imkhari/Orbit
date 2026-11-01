package com.orbit.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * DTO nhận thông tin phiên tập trung Pomodoro từ Client.
 */
public record LogFocusSessionRequest(
        UUID taskId,

        @NotNull(message = "Thời lượng phiên tập trung không được để trống")
        @Min(value = 1, message = "Thời lượng tối thiểu 1 phút")
        @Max(value = 180, message = "Thời lượng tối đa 180 phút")
        Integer durationMinutes,

        Boolean isCompleted
) {
    public LogFocusSessionRequest {
        if (isCompleted == null) {
            isCompleted = false;
        }
    }
}
