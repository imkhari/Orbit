package com.orbit.controller;

import com.orbit.dto.request.LogFocusSessionRequest;
import com.orbit.dto.response.ApiResponse;
import com.orbit.dto.response.FocusSessionResponse;
import com.orbit.service.FocusSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/focus/sessions")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class FocusSessionController {

    private final FocusSessionService focusSessionService;

    /**
     * Ghi nhận phiên tập trung Pomodoro và tự động cộng 15 XP khi hoàn thành đủ 25 phút.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<FocusSessionResponse>> logFocusSession(
            @RequestParam(required = false) UUID userId,
            @Valid @RequestBody LogFocusSessionRequest request
    ) {
        log.info("REST request to log focus session: {} mins for user ID: {}", request.durationMinutes(), userId);
        FocusSessionResponse response = focusSessionService.logSession(userId, request);
        String message = response.earnedXp() > 0
                ? "Tuyệt vời! Bạn vừa hoàn thành phiên Pomodoro và nhận +" + response.earnedXp() + " XP!"
                : "Phiên tập trung đã được ghi nhận an toàn.";
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response, message));
    }

    /**
     * Lấy danh sách các phiên tập trung Pomodoro đã hoàn thành trong ngày hôm nay.
     */
    @GetMapping("/today")
    public ResponseEntity<ApiResponse<List<FocusSessionResponse>>> getTodaySessions(
            @RequestParam(required = false) UUID userId
    ) {
        log.info("REST request to get today's focus sessions for user ID: {}", userId);
        List<FocusSessionResponse> sessions = focusSessionService.getTodaySessions(userId);
        return ResponseEntity.ok(ApiResponse.ok(sessions, "Lấy danh sách phiên tập trung trong ngày thành công"));
    }
}
