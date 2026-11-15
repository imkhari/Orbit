package com.orbit.dto.request;

import com.orbit.entity.User;
import jakarta.validation.constraints.NotNull;

/**
 * DTO nhận dữ liệu cập nhật mức năng lượng người dùng.
 */
public record UpdateEnergyRequest(
    @NotNull(message = "Mức năng lượng không được để trống")
    User.EnergyLevel energyLevel
) {
}
