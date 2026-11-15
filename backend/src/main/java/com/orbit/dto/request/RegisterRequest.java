package com.orbit.dto.request;

import com.orbit.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO nhận dữ liệu đăng ký tài khoản mới.
 */
public record RegisterRequest(
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    String email,

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải từ 6 ký tự trở lên")
    String password,

    @NotBlank(message = "Tên hiển thị không được để trống")
    @Size(min = 2, max = 50, message = "Tên hiển thị phải từ 2 đến 50 ký tự")
    String displayName,

    User.EnergyLevel initialEnergyLevel
) {
    public User.EnergyLevel initialEnergyLevelOrDefault() {
        return initialEnergyLevel != null ? initialEnergyLevel : User.EnergyLevel.MEDIUM;
    }
}
