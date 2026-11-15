package com.orbit.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO nhận dữ liệu làm mới Access Token.
 */
public record RefreshTokenRequest(
    @NotBlank(message = "Refresh token không được để trống")
    String refreshToken
) {
}
