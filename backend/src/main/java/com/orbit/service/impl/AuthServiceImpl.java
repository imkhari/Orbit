package com.orbit.service.impl;

import com.orbit.dto.request.LoginRequest;
import com.orbit.dto.request.RefreshTokenRequest;
import com.orbit.dto.request.RegisterRequest;
import com.orbit.dto.response.AuthResponse;
import com.orbit.dto.response.UserResponse;
import com.orbit.entity.User;
import com.orbit.exception.RegistrationException;
import com.orbit.exception.ResourceNotFoundException;
import com.orbit.repository.UserRepository;
import com.orbit.security.JwtTokenProvider;
import com.orbit.service.AuthService;
import com.orbit.service.StreakService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final StreakService streakService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if ("demo@orbit.app".equals(email)) {
            throw new RegistrationException("Địa chỉ này dành cho chế độ thử trên máy.");
        }

        if (userRepository.existsByEmail(email)) {
            throw new RegistrationException("Email này đã có tài khoản. Bạn có thể đăng nhập bằng email này.");
        }

        log.info("Registering new user with email: {}", email);

        User user = User.builder()
            .email(email)
            .passwordHash(passwordEncoder.encode(request.password()))
            .displayName(request.displayName().trim())
            .currentEnergyLevel(request.initialEnergyLevelOrDefault())
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();

        User savedUser = userRepository.save(user);

        // Khởi tạo chuỗi Streak ban đầu (2 Freeze Credits, 150 XP mồi)
        try {
            streakService.getUserStreak(savedUser.getId());
        } catch (Exception e) {
            log.warn("Could not pre-initialize streak for user ID {}: {}", savedUser.getId(), e.getMessage());
        }

        return UserResponse.fromEntity(savedUser);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();
        log.info("Attempting login for email: {}", email);

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new BadCredentialsException("Email hoặc mật khẩu chưa chính xác."));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Email hoặc mật khẩu chưa chính xác.");
        }

        String accessToken = tokenProvider.generateAccessToken(user);
        String refreshToken = tokenProvider.generateRefreshToken(user);

        return AuthResponse.of(
            accessToken,
            refreshToken,
            tokenProvider.getAccessTokenExpirationSeconds(),
            UserResponse.fromEntity(user)
        );
    }

    @Override
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        User user = tokenProvider.refreshSubject(request.refreshToken())
            .flatMap(userRepository::findById)
            .orElseThrow(() -> new BadCredentialsException("Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại."));

        String newAccessToken = tokenProvider.generateAccessToken(user);
        String newRefreshToken = tokenProvider.generateRefreshToken(user);

        return AuthResponse.of(
            newAccessToken,
            newRefreshToken,
            tokenProvider.getAccessTokenExpirationSeconds(),
            UserResponse.fromEntity(user)
        );
    }

    @Override
    public UserResponse getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Người dùng", userId));
        return UserResponse.fromEntity(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserResponse updateEnergyLevel(UUID userId, User.EnergyLevel energyLevel) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Người dùng", userId));

        user.setCurrentEnergyLevel(energyLevel);
        user.setUpdatedAt(Instant.now());
        User updated = userRepository.save(user);

        log.info("Updated energy level to {} for user ID {}", energyLevel, userId);
        return UserResponse.fromEntity(updated);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserResponse updateProfile(UUID userId, com.orbit.dto.request.UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Người dùng", userId));

        if (request.displayName() != null && !request.displayName().isBlank()) {
            user.setDisplayName(request.displayName().trim());
        }
        if (request.energyLevel() != null) {
            user.setCurrentEnergyLevel(request.energyLevel());
        }
        user.setUpdatedAt(Instant.now());
        User updated = userRepository.save(user);

        log.info("Updated profile for user ID {}", userId);
        return UserResponse.fromEntity(updated);
    }
}
