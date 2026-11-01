package com.orbit.service;

import com.orbit.dto.response.StreakResponse;

import java.util.UUID;

/**
 * Service quản lý chuỗi ngày liên tiếp (Streak) và điểm kinh nghiệm (XP)
 * với cơ chế Khiên Đóng Băng (Streak Freeze Shield) bảo vệ tâm lý người dùng ADHD.
 */
public interface StreakService {

    /**
     * Lấy thông tin chuỗi ngày, cấp độ và số khiên bảo vệ hiện có của người dùng.
     * Tự động kiểm tra và kích hoạt Khiên Đóng Băng nếu phát hiện người dùng bỏ lỡ ngày hôm qua (Edge Case 03).
     *
     * @param userId ID người dùng
     * @return StreakResponse chi tiết
     */
    StreakResponse getUserStreak(UUID userId);

    /**
     * Ghi nhận một hành động hoàn thành (hoàn thành subtask, task hoặc phiên pomodoro) để cộng XP
     * và cập nhật tiến trình chuỗi ngày.
     *
     * @param userId ID người dùng
     * @param xpReward Điểm thưởng XP (luôn dương)
     * @return StreakResponse sau khi cập nhật
     */
    StreakResponse recordActivity(UUID userId, int xpReward);
}
