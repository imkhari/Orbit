package com.orbit.dto.response;

import com.orbit.entity.StreakHistory;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO trả về thông tin chuỗi ngày liên tiếp, điểm kinh nghiệm và trạng thái Khiên Đóng Băng.
 */
public record StreakResponse(
        UUID userId,
        Integer currentStreak,
        Integer longestStreak,
        Integer freezeCredits,
        StreakHistory.StreakState streakState,
        Integer totalXp,
        Integer currentLevel,
        Boolean isFrozenToday,
        LocalDate lastActiveDate,
        String gentleMessage
) {
    public static StreakResponse fromEntity(StreakHistory history, String message) {
        boolean frozenToday = history.getStreakState() == StreakHistory.StreakState.FROZEN;
        return new StreakResponse(
                history.getUser() != null ? history.getUser().getId() : null,
                history.getCurrentStreak(),
                history.getLongestStreak(),
                history.getFreezeCredits(),
                history.getStreakState(),
                history.getTotalXp(),
                history.getCurrentLevel(),
                frozenToday,
                history.getLastActiveDate(),
                message
        );
    }
}
