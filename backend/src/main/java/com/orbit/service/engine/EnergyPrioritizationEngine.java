package com.orbit.service.engine;

import com.orbit.dto.response.TaskResponse;
import com.orbit.entity.Task;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;

/**
 * Thuật toán tính Điểm Ưu Tiên Thích Ứng Mức Năng Lượng (Energy-Adaptive Prioritization)
 * theo đặc tả PRD Epic 5 và Edge Case 06.
 *
 * Công thức: P(T) = 0.40 * U(T) + 0.45 * E(T, UserEnergy) + 0.15 * C(T)
 */
@Component
public class EnergyPrioritizationEngine {

    public static final double WEIGHT_URGENCY = 0.40;
    public static final double WEIGHT_ENERGY = 0.45;
    public static final double WEIGHT_QUICK_WIN = 0.15;

    /**
     * Tính toán điểm ưu tiên P(T) in [0, 100] cho một nhiệm vụ.
     */
    public double calculatePriorityScore(Task task, Task.EnergyRequirement userEnergy, Instant now) {
        if (task == null) return 0.0;

        Task.EnergyRequirement resolvedUserEnergy = userEnergy != null ? userEnergy : Task.EnergyRequirement.MEDIUM;
        Instant evaluationTime = now != null ? now : Instant.now();

        double u = calculateUrgencyScore(task, evaluationTime);
        double e = calculateEnergyCompatibilityScore(task.getEnergyRequired(), resolvedUserEnergy);
        double c = calculateQuickWinScore(task.getEstimatedMinutes());

        double rawScore = (WEIGHT_URGENCY * u) + (WEIGHT_ENERGY * e) + (WEIGHT_QUICK_WIN * c);
        double clampedScore = Math.max(0.0, Math.min(100.0, rawScore));

        return Math.round(clampedScore * 10.0) / 10.0;
    }

    /**
     * Hàm Điểm Khẩn Cấp U(T) in [0, 100]:
     * - Không có deadline: 20.0 điểm cơ sở.
     * - Quá hạn (Overdue - Edge Case 06): Khống chế tối đa 90.0 điểm (tránh gây hoảng loạn tâm lý RSD).
     * - Còn hạn: 100 * exp(-delta_t / 48) với delta_t tính theo giờ.
     */
    public double calculateUrgencyScore(Task task, Instant now) {
        if (task.getDeadline() == null) {
            return 20.0;
        }

        if (task.getDeadline().isBefore(now)) {
            // Edge Case 06: Quá hạn deadline đạt 90 điểm (không dùng 100)
            return 90.0;
        }

        double diffHours = Duration.between(now, task.getDeadline()).toMinutes() / 60.0;
        if (diffHours <= 0) {
            return 90.0;
        }

        double score = 100.0 * Math.exp(-diffHours / 48.0);
        return Math.max(0.0, Math.min(100.0, score));
    }

    /**
     * Hàm Tương Thích Năng Lượng E(T, UserEnergy) in [0, 100]:
     * Ma trận tương thích giữa thể trạng não bộ người dùng và năng lượng yêu cầu của Task.
     */
    public double calculateEnergyCompatibilityScore(Task.EnergyRequirement taskEnergy, Task.EnergyRequirement userEnergy) {
        Task.EnergyRequirement tEnergy = taskEnergy != null ? taskEnergy : Task.EnergyRequirement.MEDIUM;
        Task.EnergyRequirement uEnergy = userEnergy != null ? userEnergy : Task.EnergyRequirement.MEDIUM;

        return switch (uEnergy) {
            case LOW -> switch (tEnergy) {
                case LOW -> 100.0;     // Khuyên làm
                case MEDIUM -> 30.0;   // Cân nhắc
                case HIGH -> 0.0;      // Làm mờ, ẩn đi
            };
            case MEDIUM -> switch (tEnergy) {
                case LOW -> 80.0;      // Dễ xơi
                case MEDIUM -> 100.0;  // Tối ưu
                case HIGH -> 40.0;     // Hơi nặng
            };
            case HIGH -> switch (tEnergy) {
                case LOW -> 70.0;      // Giải quyết nhanh
                case MEDIUM -> 85.0;   // Rất tốt
                case HIGH -> 100.0;    // Tối ưu Hyperfocus
            };
        };
    }

    /**
     * Hàm Chiến Thắng Nhanh C(T) in [0, 100]:
     * C(T) = max(10, 100 - estimatedMinutes / 2). Ưu tiên việc ngắn tích lũy Dopamine.
     */
    public double calculateQuickWinScore(Integer estimatedMinutes) {
        int minutes = (estimatedMinutes != null && estimatedMinutes > 0) ? estimatedMinutes : 15;
        double score = 100.0 - (minutes / 2.0);
        return Math.max(10.0, Math.min(100.0, score));
    }

    /**
     * Kiểm tra trạng thái quá hạn deadline (Edge Case 06) mà không kích hoạt màu đỏ báo động.
     */
    public boolean isOverdue(Task task, Instant now) {
        if (task == null || task.getDeadline() == null || task.getStatus() == Task.TaskStatus.DONE) {
            return false;
        }
        Instant evaluationTime = now != null ? now : Instant.now();
        return task.getDeadline().isBefore(evaluationTime);
    }

    /**
     * Kiểm tra điều kiện làm mờ thị giác (Visual Dimming):
     * Khi User chọn LOW và Task yêu cầu HIGH -> giảm opacity 35%.
     */
    public boolean isDimmed(Task task, Task.EnergyRequirement userEnergy) {
        if (task == null || userEnergy == null) return false;
        return userEnergy == Task.EnergyRequirement.LOW && task.getEnergyRequired() == Task.EnergyRequirement.HIGH;
    }

    /**
     * Chuyển đổi và gán điểm ưu tiên cho danh sách nhiệm vụ, hỗ trợ sắp xếp theo điểm P(T) giảm dần.
     */
    public List<TaskResponse> prioritizeAndMap(List<Task> tasks, Task.EnergyRequirement userEnergy, boolean sortByPriority) {
        Instant now = Instant.now();
        Task.EnergyRequirement resolvedEnergy = userEnergy != null ? userEnergy : Task.EnergyRequirement.MEDIUM;

        List<TaskResponse> responses = tasks.stream().map(task -> {
            double pScore = calculatePriorityScore(task, resolvedEnergy, now);
            boolean overdue = isOverdue(task, now);
            boolean dimmed = isDimmed(task, resolvedEnergy);
            return TaskResponse.fromEntity(task, pScore, overdue, dimmed);
        }).toList();

        if (sortByPriority) {
            return responses.stream()
                    .sorted(Comparator.comparing(TaskResponse::priorityScore, Comparator.nullsLast(Comparator.reverseOrder()))
                            .thenComparing(TaskResponse::createdAt, Comparator.nullsLast(Comparator.reverseOrder())))
                    .toList();
        }

        return responses;
    }
}

