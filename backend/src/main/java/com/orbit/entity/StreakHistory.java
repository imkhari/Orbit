package com.orbit.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Thực thể quản lý chuỗi ngày liên tiếp (Streak) và điểm kinh nghiệm (XP)
 * tích hợp cơ chế bảo vệ nhận thức ADHD (Gentle Gamification & Streak Freeze Shield).
 */
@Entity
@Table(name = "streak_histories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StreakHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Builder.Default
    @Column(nullable = false)
    private Integer currentStreak = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer longestStreak = 0;

    /**
     * Số lượng Khiên Đóng Băng đang sở hữu (Tối đa 2 khiên, mặc định 1 khiên).
     * Dùng để tha thứ và bảo vệ chuỗi ngày khi người dùng nghỉ/quên vào app (Edge Case 03).
     */
    @Builder.Default
    @Column(nullable = false)
    private Integer freezeCredits = 1;

    /**
     * Ngày gần nhất người dùng có tương tác hoàn thành công việc.
     */
    private LocalDate lastActiveDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StreakState streakState = StreakState.ACTIVE;

    /**
     * Tổng số điểm kinh nghiệm (XP); chỉ tăng, không bao giờ giảm (Zero Penalty Policy).
     */
    @Builder.Default
    @Column(nullable = false)
    private Integer totalXp = 0;

    /**
     * Cấp độ hiện tại: level = floor(sqrt(total_xp / 50)) + 1.
     */
    @Builder.Default
    @Column(nullable = false)
    private Integer currentLevel = 1;

    @Builder.Default
    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    public enum StreakState {
        ACTIVE,   // Đang tích cực duy trì chuỗi
        FROZEN,   // Vừa được Khiên Đóng Băng cứu chuỗi ngày
        RESET     // Bắt đầu lại nhịp chuỗi mới (không trừ điểm XP hay longestStreak)
    }
}
