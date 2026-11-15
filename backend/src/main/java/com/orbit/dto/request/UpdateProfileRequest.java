package com.orbit.dto.request;

import com.orbit.entity.User;
import jakarta.validation.constraints.Size;

/**
 * DTO nhận dữ liệu cập nhật thông tin hồ sơ cá nhân.
 */
public record UpdateProfileRequest(
    @Size(min = 2, max = 100, message = "Tên hiển thị phải từ 2 đến 100 ký tự")
    String displayName,

    User.EnergyLevel energyLevel
) {
}
