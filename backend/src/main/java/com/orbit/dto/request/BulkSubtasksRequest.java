package com.orbit.dto.request;

import com.orbit.entity.Task;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * DTO nhận danh sách các bước con (Subtasks) đã được người dùng phê duyệt để lưu hàng loạt vào DB.
 */
public record BulkSubtasksRequest(
        @NotEmpty(message = "Danh sách subtasks không được để trống")
        @Valid
        List<SubtaskItemRequest> subtasks
) {
    public record SubtaskItemRequest(
            @NotBlank(message = "Tiêu đề bước con không được để trống")
            @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
            String title,

            @Min(value = 1, message = "Thời gian ước tính tối thiểu 1 phút")
            @Max(value = 120, message = "Thời gian ước tính tối đa 120 phút")
            Integer estimatedMinutes,

            Task.EnergyRequirement energyLevel,

            Integer stepOrder,

            Boolean isCompleted
    ) {
        public SubtaskItemRequest {
            if (estimatedMinutes == null) {
                estimatedMinutes = 15;
            }
            if (energyLevel == null) {
                energyLevel = Task.EnergyRequirement.LOW;
            }
            if (isCompleted == null) {
                isCompleted = false;
            }
        }
    }
}
