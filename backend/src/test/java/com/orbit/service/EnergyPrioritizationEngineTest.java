package com.orbit.service;

import com.orbit.dto.response.TaskResponse;
import com.orbit.entity.Task;
import com.orbit.service.engine.EnergyPrioritizationEngine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class EnergyPrioritizationEngineTest {

    private EnergyPrioritizationEngine engine;

    @BeforeEach
    void setUp() {
        engine = new EnergyPrioritizationEngine();
    }

    @Test
    @DisplayName("Hàm Khẩn Cấp U(T): Không có deadline -> 20.0 điểm cơ sở")
    void urgencyScore_NoDeadline_ReturnsBaseScore() {
        Task task = Task.builder().title("Task no deadline").build();
        double score = engine.calculateUrgencyScore(task, Instant.now());
        assertThat(score).isEqualTo(20.0);
    }

    @Test
    @DisplayName("Hàm Khẩn Cấp U(T) (Edge Case 06): Quá hạn deadline đạt trần 90.0 (Không đặt 100 để tránh hoảng loạn)")
    void urgencyScore_Overdue_Returns90Points() {
        Instant pastDeadline = Instant.now().minus(2, ChronoUnit.HOURS);
        Task task = Task.builder()
                .title("Overdue task")
                .deadline(pastDeadline)
                .status(Task.TaskStatus.TODO)
                .build();

        double score = engine.calculateUrgencyScore(task, Instant.now());
        assertThat(score).isEqualTo(90.0);
        assertThat(engine.isOverdue(task, Instant.now())).isTrue();
    }

    @Test
    @DisplayName("Hàm Khẩn Cấp U(T): Deadline trong tương lai tính theo hàm số mũ suy giảm")
    void urgencyScore_FutureDeadline_FollowsExponentialCurve() {
        Instant now = Instant.now();
        Instant in48Hours = now.plus(48, ChronoUnit.HOURS);
        Task task = Task.builder().title("Task in 48h").deadline(in48Hours).build();

        // U(48h) = 100 * exp(-48/48) = 100 * exp(-1) ~ 36.78
        double score = engine.calculateUrgencyScore(task, now);
        assertThat(score).isCloseTo(36.78, within(0.1));
    }

    @Test
    @DisplayName("Hàm Tương Thích Năng Lượng E(T): Tuân thủ ma trận 9 ô nhận thức ADHD")
    void energyCompatibilityScore_MatchesMatrix() {
        // User LOW (Kiệt sức)
        assertThat(engine.calculateEnergyCompatibilityScore(Task.EnergyRequirement.LOW, Task.EnergyRequirement.LOW)).isEqualTo(100.0);
        assertThat(engine.calculateEnergyCompatibilityScore(Task.EnergyRequirement.MEDIUM, Task.EnergyRequirement.LOW)).isEqualTo(30.0);
        assertThat(engine.calculateEnergyCompatibilityScore(Task.EnergyRequirement.HIGH, Task.EnergyRequirement.LOW)).isEqualTo(0.0);

        // User MEDIUM (Bình thường)
        assertThat(engine.calculateEnergyCompatibilityScore(Task.EnergyRequirement.LOW, Task.EnergyRequirement.MEDIUM)).isEqualTo(80.0);
        assertThat(engine.calculateEnergyCompatibilityScore(Task.EnergyRequirement.MEDIUM, Task.EnergyRequirement.MEDIUM)).isEqualTo(100.0);
        assertThat(engine.calculateEnergyCompatibilityScore(Task.EnergyRequirement.HIGH, Task.EnergyRequirement.MEDIUM)).isEqualTo(40.0);

        // User HIGH (Hưng phấn / Hyperfocus)
        assertThat(engine.calculateEnergyCompatibilityScore(Task.EnergyRequirement.LOW, Task.EnergyRequirement.HIGH)).isEqualTo(70.0);
        assertThat(engine.calculateEnergyCompatibilityScore(Task.EnergyRequirement.MEDIUM, Task.EnergyRequirement.HIGH)).isEqualTo(85.0);
        assertThat(engine.calculateEnergyCompatibilityScore(Task.EnergyRequirement.HIGH, Task.EnergyRequirement.HIGH)).isEqualTo(100.0);
    }

    @Test
    @DisplayName("Hàm Chiến Thắng Nhanh C(T): Ưu tiên công việc ngắn tích lũy Dopamine")
    void quickWinScore_FavorsShortTasks() {
        assertThat(engine.calculateQuickWinScore(10)).isEqualTo(95.0);
        assertThat(engine.calculateQuickWinScore(120)).isEqualTo(40.0);
        assertThat(engine.calculateQuickWinScore(250)).isEqualTo(10.0); // Bị kẹp min 10
    }

    @Test
    @DisplayName("Điểm Ưu Tiên Tổng Hợp P(T): Kết hợp đúng trọng số 0.40 U + 0.45 E + 0.15 C")
    void priorityScore_CombinesWeightsCorrectly() {
        Task task = Task.builder()
                .title("Đọc 3 trang sách")
                .energyRequired(Task.EnergyRequirement.LOW)
                .estimatedMinutes(10) // C = 95.0
                .build(); // Không deadline -> U = 20.0

        // Với User LOW: E = 100.0
        // P = 0.40 * 20.0 + 0.45 * 100.0 + 0.15 * 95.0 = 8.0 + 45.0 + 14.25 = 67.25 -> 67.3
        double score = engine.calculatePriorityScore(task, Task.EnergyRequirement.LOW, Instant.now());
        assertThat(score).isEqualTo(67.3);
    }

    @Test
    @DisplayName("Hiệu ứng Làm Mờ Thị Giác (isDimmed): Bật khi User LOW và Task HIGH")
    void visualDimming_ActiveOnlyWhenUserLowAndTaskHigh() {
        Task highTask = Task.builder().title("Viết luận văn").energyRequired(Task.EnergyRequirement.HIGH).build();
        Task lowTask = Task.builder().title("Uống nước").energyRequired(Task.EnergyRequirement.LOW).build();

        assertThat(engine.isDimmed(highTask, Task.EnergyRequirement.LOW)).isTrue();
        assertThat(engine.isDimmed(lowTask, Task.EnergyRequirement.LOW)).isFalse();
        assertThat(engine.isDimmed(highTask, Task.EnergyRequirement.HIGH)).isFalse();
    }

    @Test
    @DisplayName("Sắp xếp danh sách theo P(T) giảm dần khi sortByPriority = true")
    void prioritizeAndMap_SortsDescending() {
        Task easyTask = Task.builder()
                .title("Uống nước")
                .energyRequired(Task.EnergyRequirement.LOW)
                .estimatedMinutes(5)
                .createdAt(Instant.now().minusSeconds(100))
                .build();

        Task heavyTask = Task.builder()
                .title("Code kiến trúc phức tạp")
                .energyRequired(Task.EnergyRequirement.HIGH)
                .estimatedMinutes(120)
                .createdAt(Instant.now().minusSeconds(50))
                .build();

        List<TaskResponse> sorted = engine.prioritizeAndMap(List.of(heavyTask, easyTask), Task.EnergyRequirement.LOW, true);

        assertThat(sorted).hasSize(2);
        // Khi User LOW, task dễ có điểm P(T) cao hơn hẳn và đứng đầu
        assertThat(sorted.get(0).title()).isEqualTo("Uống nước");
        assertThat(sorted.get(1).title()).isEqualTo("Code kiến trúc phức tạp");
        assertThat(sorted.get(1).isDimmed()).isTrue();
    }
}

