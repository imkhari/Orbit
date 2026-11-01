package com.orbit.service;

import com.orbit.dto.request.LogFocusSessionRequest;
import com.orbit.dto.response.FocusSessionResponse;

import java.util.List;
import java.util.UUID;

/**
 * Service quản lý các phiên tập trung Pomodoro đơn nhiệm (Focus Sessions).
 */
public interface FocusSessionService {

    /**
     * Ghi nhận một phiên tập trung và tự động cộng 15 XP nếu hoàn thành đủ 25 phút.
     *
     * @param userId ID người dùng
     * @param request Thông tin phiên tập trung
     * @return FocusSessionResponse kèm số XP nhận được
     */
    FocusSessionResponse logSession(UUID userId, LogFocusSessionRequest request);

    /**
     * Lấy danh sách các phiên tập trung đã thực hiện trong ngày hôm nay.
     *
     * @param userId ID người dùng
     * @return Danh sách phiên tập trung trong ngày
     */
    List<FocusSessionResponse> getTodaySessions(UUID userId);
}
