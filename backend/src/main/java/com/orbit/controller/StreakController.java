package com.orbit.controller;

import com.orbit.dto.response.ApiResponse;
import com.orbit.dto.response.StreakResponse;
import com.orbit.service.StreakService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users/me/streak")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class StreakController {

    private final StreakService streakService;

    /**
     * Lấy thông tin chuỗi ngày liên tiếp (Streak), số Khiên Đóng Băng (Freeze Shield)
     * và điểm kinh nghiệm (XP) của người dùng hiện tại.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<StreakResponse>> getMyStreak(
            @RequestParam(required = false) UUID userId
    ) {
        log.info("REST request to get streak status for user ID: {}", userId);
        StreakResponse response = streakService.getUserStreak(userId);
        return ResponseEntity.ok(ApiResponse.ok(response, response.gentleMessage()));
    }
}
