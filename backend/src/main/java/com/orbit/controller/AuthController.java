package com.orbit.controller;

import com.orbit.security.CurrentAccount;
import com.orbit.dto.request.LoginRequest;
import com.orbit.dto.request.RefreshTokenRequest;
import com.orbit.dto.request.RegisterRequest;
import com.orbit.dto.request.UpdateEnergyRequest;
import com.orbit.dto.response.ApiResponse;
import com.orbit.dto.response.AuthResponse;
import com.orbit.dto.response.UserResponse;
import com.orbit.entity.User;
import com.orbit.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(@Valid @RequestBody RegisterRequest request) {
        log.info("REST request to register user with email '{}'", request.email());
        UserResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(response, "Đăng ký thành công. Bạn có thể đăng nhập bằng tài khoản vừa tạo."));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        log.info("REST request to login user '{}'", request.email());
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Đăng nhập thành công! Chào mừng bạn trở lại Orbit 🌌"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Làm mới phiên làm việc thành công"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        User currentUser = CurrentAccount.require();
        UserResponse response = authService.getCurrentUser(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(response, "Lấy thông tin người dùng thành công"));
    }

    @PatchMapping("/me/energy")
    public ResponseEntity<ApiResponse<UserResponse>> updateEnergyLevel(
        @Valid @RequestBody UpdateEnergyRequest request
    ) {
        User currentUser = CurrentAccount.require();
        UserResponse response = authService.updateEnergyLevel(currentUser.getId(), request.energyLevel());
        return ResponseEntity.ok(ApiResponse.ok(response, "Đã cập nhật mức năng lượng hiện tại"));
    }

    @PutMapping("/me/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
        @Valid @RequestBody com.orbit.dto.request.UpdateProfileRequest request
    ) {
        User currentUser = CurrentAccount.require();
        UserResponse response = authService.updateProfile(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Cập nhật hồ sơ cá nhân thành công! 🌿"));
    }
}
