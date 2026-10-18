package com.orbit.dto.request;

import com.orbit.entity.Task;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * DTO nhận dữ liệu tạo mới nhiệm vụ (Instant Task Capture <5s).
 */
public record CreateTaskRequest(
    @NotBlank(message = "Tiêu đề nhiệm vụ không được để trống")
    @Size(min = 2, max = 255, message = "Tiêu đề nhiệm vụ phải từ 2 đến 255 ký tự")
    String title,

    @Size(max = 2000, message = "Mô tả không được vượt quá 2000 ký tự")
    String description,

    Task.EnergyRequirement energyRequired,

    @Min(value = 1, message = "Thời gian ước tính tối thiểu 1 phút")
    @Max(value = 480, message = "Thời gian ước tính tối đa 480 phút")
    Integer estimatedMinutes,

    Task.UrgencyLevel urgency,

    UUID userId
) {
    public Task.EnergyRequirement energyRequiredOrDefault() {
        return energyRequired != null ? energyRequired : Task.EnergyRequirement.MEDIUM;
    }

    public Task.UrgencyLevel urgencyOrDefault() {
        return urgency != null ? urgency : Task.UrgencyLevel.MEDIUM;
    }
}
