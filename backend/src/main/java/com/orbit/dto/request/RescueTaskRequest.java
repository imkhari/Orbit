package com.orbit.dto.request;

import com.orbit.entity.Task;
import java.util.UUID;

/**
 * Yêu cầu giải cứu người dùng khỏi trạng thái Tê liệt hành động (Analysis Paralysis Rescue).
 * Người dùng ADHD chỉ cần cung cấp mức năng lượng hiện tại và thời gian rảnh.
 */
public record RescueTaskRequest(
    UUID boardId,
    Task.EnergyRequirement currentEnergy,
    Integer availableMinutes
) {
    public Task.EnergyRequirement currentEnergyOrDefault() {
        return currentEnergy != null ? currentEnergy : Task.EnergyRequirement.MEDIUM;
    }

    public int availableMinutesOrDefault() {
        return availableMinutes != null && availableMinutes > 0 ? availableMinutes : 25;
    }
}
