package com.orbit.dto.response;

import com.orbit.entity.User;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO trả về thông tin người dùng.
 */
public record UserResponse(
    UUID id,
    String email,
    String displayName,
    String avatarUrl,
    User.EnergyLevel currentEnergyLevel,
    Instant createdAt
) {
    public static UserResponse fromEntity(User user) {
        if (user == null) return null;
        return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getDisplayName(),
            user.getAvatarUrl(),
            user.getCurrentEnergyLevel(),
            user.getCreatedAt()
        );
    }
}
