package com.orbit.config;

import com.orbit.entity.Board;
import com.orbit.entity.StreakHistory;
import com.orbit.entity.Subtask;
import com.orbit.entity.Task;
import com.orbit.entity.User;
import com.orbit.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Tự động nạp bộ dữ liệu demo "Người Thật Việc Thật" cho người ADHD
 * nếu cơ sở dữ liệu còn trống, giúp màn hình Kanban và buổi demo sống động ngay lập tức.
 */
@Component
@Order(10)
@RequiredArgsConstructor
@Slf4j
public class DemoDataSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final BoardRepository boardRepository;
    private final TaskRepository taskRepository;
    private final SubtaskRepository subtaskRepository;
    private final StreakHistoryRepository streakHistoryRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (taskRepository.count() > 0) {
            log.info("Database already contains tasks. Skipping DemoDataSeeder.");
            return;
        }

        log.info("Seeding realistic ADHD demo data into database...");

        // 1. Khởi tạo Demo User
        User user = userRepository.findByEmail("demo@orbit.app").orElseGet(() ->
            userRepository.save(User.builder()
                .email("demo@orbit.app")
                .displayName("ADHD Explorer")
                .passwordHash("$2a$10$demoHashPlaceholderForOrbitDemoUser")
                .currentEnergyLevel(User.EnergyLevel.MEDIUM)
                .createdAt(Instant.now().minus(7, ChronoUnit.DAYS))
                .updatedAt(Instant.now())
                .build())
        );

        // 2. Khởi tạo Streak History (5 ngày liên tiếp + 2 Khiên Đóng Băng)
        if (streakHistoryRepository.findByUserId(user.getId()).isEmpty()) {
            streakHistoryRepository.save(StreakHistory.builder()
                .user(user)
                .currentStreak(5)
                .longestStreak(5)
                .freezeCredits(2)
                .streakState(StreakHistory.StreakState.ACTIVE)
                .totalXp(185)
                .currentLevel(2)
                .lastActiveDate(LocalDate.now())
                .updatedAt(Instant.now())
                .build());
        }

        // 3. Khởi tạo 3 Bảng làm việc ADHD
        Board boardStudy = boardRepository.save(Board.builder()
            .user(user)
            .title("Học Tập & Nghiên Cứu")
            .icon("🎓")
            .colorTheme("sky")
            .position(0)
            .isArchived(false)
            .build());

        Board boardWork = boardRepository.save(Board.builder()
            .user(user)
            .title("Dự Án & Công Việc")
            .icon("💼")
            .colorTheme("amber")
            .position(1)
            .isArchived(false)
            .build());

        Board boardLife = boardRepository.save(Board.builder()
            .user(user)
            .title("Đời Sống & Việc Nhà")
            .icon("🏠")
            .colorTheme("emerald")
            .position(2)
            .isArchived(false)
            .build());

        // 4. Khởi tạo các nhiệm vụ mẫu đại diện
        // Task 1: Cột DOING (duy nhất 1 việc active WIP = 1)
        Task doingTask = taskRepository.save(Task.builder()
            .user(user)
            .board(boardStudy)
            .title("Viết slide thuyết trình đồ án tốt nghiệp Orbit")
            .description("Chuẩn bị slide giới thiệu sứ mệnh nhận thức ADHD, Clean Architecture Spring Boot 3 và React Native.")
            .energyRequired(Task.EnergyRequirement.HIGH)
            .urgency(Task.UrgencyLevel.HIGH)
            .estimatedMinutes(45)
            .status(Task.TaskStatus.DOING)
            .position(0)
            .createdAt(Instant.now().minus(2, ChronoUnit.HOURS))
            .build());

        // Subtasks của doingTask: 2 bước đã xong, 1 bước đang đợi
        List<Subtask> doingSubtasks = new ArrayList<>();
        doingSubtasks.add(Subtask.builder()
            .task(doingTask)
            .title("Mở Google Slides và tạo khung 5 phần chính")
            .estimatedMinutes(3)
            .energyLevel(Task.EnergyRequirement.LOW)
            .stepOrder(1)
            .isCompleted(true)
            .completedAt(Instant.now().minus(40, ChronoUnit.MINUTES))
            .build());

        doingSubtasks.add(Subtask.builder()
            .task(doingTask)
            .title("Chụp 3 màn hình demo nổi bật trên máy ảo Android")
            .estimatedMinutes(10)
            .energyLevel(Task.EnergyRequirement.MEDIUM)
            .stepOrder(2)
            .isCompleted(true)
            .completedAt(Instant.now().minus(20, ChronoUnit.MINUTES))
            .build());

        doingSubtasks.add(Subtask.builder()
            .task(doingTask)
            .title("Soạn kịch bản thuyết trình 3 phút giải quyết nỗi đau ADHD")
            .estimatedMinutes(15)
            .energyLevel(Task.EnergyRequirement.HIGH)
            .stepOrder(3)
            .isCompleted(false)
            .build());

        subtaskRepository.saveAll(doingSubtasks);

        // Task 2: Cột TODO (Nhiệm vụ nhẹ nhàng xoa dịu stress)
        Task todoTask1 = taskRepository.save(Task.builder()
            .user(user)
            .board(boardLife)
            .title("Dọn dẹp bàn làm việc và xếp lại sách vở")
            .description("Không gian làm việc gọn gàng sẽ giúp não bộ giảm căng thẳng thị giác.")
            .energyRequired(Task.EnergyRequirement.LOW)
            .urgency(Task.UrgencyLevel.LOW)
            .estimatedMinutes(15)
            .status(Task.TaskStatus.TODO)
            .position(0)
            .createdAt(Instant.now().minus(3, ChronoUnit.HOURS))
            .build());

        List<Subtask> todoSubtasks = new ArrayList<>();
        todoSubtasks.add(Subtask.builder()
            .task(todoTask1)
            .title("Nhặt 3 cốc cà phê và vỏ giấy bỏ vào thùng rác")
            .estimatedMinutes(2)
            .energyLevel(Task.EnergyRequirement.LOW)
            .stepOrder(1)
            .isCompleted(false)
            .build());
        todoSubtasks.add(Subtask.builder()
            .task(todoTask1)
            .title("Lau sạch mặt bàn bằng khăn ẩm để tạo cảm giác tươi mới")
            .estimatedMinutes(3)
            .energyLevel(Task.EnergyRequirement.LOW)
            .stepOrder(2)
            .isCompleted(false)
            .build());
        subtaskRepository.saveAll(todoSubtasks);

        // Task 3: Cột TODO (Việc cần làm ngay)
        taskRepository.save(Task.builder()
            .user(user)
            .board(boardWork)
            .title("Trả lời email xác nhận lịch phỏng vấn thực tập")
            .description("Đọc kỹ yêu cầu và chọn khung giờ 9h sáng thứ Năm.")
            .energyRequired(Task.EnergyRequirement.MEDIUM)
            .urgency(Task.UrgencyLevel.HIGH)
            .estimatedMinutes(10)
            .status(Task.TaskStatus.TODO)
            .position(1)
            .createdAt(Instant.now().minus(4, ChronoUnit.HOURS))
            .build());

        // Task 4: Cột BACKLOG (Nhiệm vụ lớn chuẩn bị bẻ bằng AI)
        taskRepository.save(Task.builder()
            .user(user)
            .board(boardStudy)
            .title("Nghiên cứu kiến trúc Event-Driven với Apache Kafka và Debezium CDC")
            .description("Tìm hiểu cách đồng bộ dữ liệu Real-time giữa các microservices một cách tin cậy và không bị mất mát thông điệp.")
            .energyRequired(Task.EnergyRequirement.HIGH)
            .urgency(Task.UrgencyLevel.MEDIUM)
            .estimatedMinutes(60)
            .status(Task.TaskStatus.BACKLOG)
            .position(0)
            .createdAt(Instant.now().minus(5, ChronoUnit.HOURS))
            .build());

        // Task 5: Cột DONE (Chiến thắng đã hoàn thành, tích lũy XP)
        taskRepository.save(Task.builder()
            .user(user)
            .board(boardStudy)
            .title("Cài đặt môi trường phát triển Spring Boot 3 và Expo SDK 58")
            .description("Hoàn tất cấu hình JDK 21, Android Studio Device Manager và kết nối NeonDB.")
            .energyRequired(Task.EnergyRequirement.MEDIUM)
            .urgency(Task.UrgencyLevel.LOW)
            .estimatedMinutes(30)
            .status(Task.TaskStatus.DONE)
            .position(0)
            .createdAt(Instant.now().minus(1, ChronoUnit.DAYS))
            .completedAt(Instant.now().minus(12, ChronoUnit.HOURS))
            .build());

        log.info("DemoDataSeeder completed successfully with 5 tasks and 5 subtasks!");
    }
}
