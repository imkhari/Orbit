package com.orbit.dto.response;

/**
 * DTO trả về kết quả đăng nhập / đăng ký / refresh token.
 */
public record AuthResponse(
    String accessToken,
    String refreshToken,
    String tokenType,
    long expiresIn,
    UserResponse user
) {
    public static AuthResponse of(String accessToken, String refreshToken, long expiresIn, UserResponse user) {
        return new AuthResponse(accessToken, refreshToken, "Bearer", expiresIn, user);
    }
}
