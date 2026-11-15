package com.orbit.service;

import com.orbit.dto.request.LoginRequest;
import com.orbit.dto.request.RefreshTokenRequest;
import com.orbit.dto.request.RegisterRequest;
import com.orbit.dto.response.AuthResponse;
import com.orbit.dto.response.UserResponse;
import com.orbit.entity.User;

import java.util.UUID;

public interface AuthService {

    /**
     * Đăng ký tài khoản người dùng mới.
     */
    AuthResponse register(RegisterRequest request);

    /**
     * Đăng nhập người dùng bằng email và mật khẩu.
     */
    AuthResponse login(LoginRequest request);

    /**
     * Làm mới Access Token bằng Refresh Token.
     */
    AuthResponse refreshToken(RefreshTokenRequest request);

    /**
     * Lấy thông tin người dùng hiện tại theo ID.
     */
    UserResponse getCurrentUser(UUID userId);

    /**
     * Cập nhật mức năng lượng hiện tại của người dùng.
     */
    UserResponse updateEnergyLevel(UUID userId, User.EnergyLevel energyLevel);

    /**
     * Cập nhật thông tin hồ sơ người dùng (tên hiển thị, năng lượng).
     */
    UserResponse updateProfile(UUID userId, com.orbit.dto.request.UpdateProfileRequest request);
}
