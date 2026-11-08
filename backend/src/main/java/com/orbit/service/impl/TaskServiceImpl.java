package com.orbit.service.impl;

import com.orbit.dto.request.CreateTaskRequest;
import com.orbit.dto.request.UpdateTaskStatusRequest;
import com.orbit.dto.response.TaskResponse;
import com.orbit.entity.Task;
import com.orbit.entity.User;
import com.orbit.exception.ResourceNotFoundException;
import com.orbit.exception.WipLimitExceededException;
import com.orbit.repository.TaskRepository;
import com.orbit.repository.UserRepository;
import com.orbit.service.StreakService;
import com.orbit.service.TaskService;
import com.orbit.service.engine.EnergyPrioritizationEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final StreakService streakService;
    private final EnergyPrioritizationEngine energyPrioritizationEngine;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TaskResponse createTask(CreateTaskRequest request) {
        log.info("Creating new task with energy: {}", request.energyRequiredOrDefault());

        User user = resolveUser(request.userId());

        String rawTitle = request.title().trim();
        String title = rawTitle;
        String description = request.description();

        // Edge Case 05: Tự động chia tách văn bản dài khi Instant Capture mà không làm đứt mạch cảm xúc < 5s
        if (rawTitle.length() > 100) {
            int splitIndex = 100;
            int lastSpace = rawTitle.substring(0, 100).lastIndexOf(' ');
            if (lastSpace > 30) {
                splitIndex = lastSpace;
            }
            title = rawTitle.substring(0, splitIndex).trim();
            String remainder = rawTitle.substring(splitIndex).trim();
            if (description != null && !description.isBlank()) {
                description = remainder + "\n\n" + description.trim();
            } else {
                description = remainder;
            }
            log.info("Edge Case 05 applied: Auto-split raw text from {} chars into title ({} chars) and description",
                    rawTitle.length(), title.length());
        }

        Task task = Task.builder()
            .user(user)
            .title(title)
            .description(description)
            .energyRequired(request.energyRequiredOrDefault())
            .urgency(request.urgencyOrDefault())
            .estimatedMinutes(request.estimatedMinutes())
            .status(Task.TaskStatus.BACKLOG)
            .position(0)
            .createdAt(Instant.now())
            .build();

        Task saved = taskRepository.save(task);
        log.info("Task created successfully with ID: '{}' (Title: '{}')", saved.getId(), saved.getTitle());
        return TaskResponse.fromEntity(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TaskResponse updateTaskStatus(UUID taskId, UpdateTaskStatusRequest request) {
        log.info("Updating status for task ID: {} to {}", taskId, request.status());

        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Nhiệm vụ", taskId));

        Task.TaskStatus targetStatus = request.status();

        // Kiểm tra ràng buộc đơn nhiệm (WIP Limit = 1) khi chuyển sang DOING
        if (targetStatus == Task.TaskStatus.DOING && task.getStatus() != Task.TaskStatus.DOING) {
            long activeDoingCount = (task.getUser() != null)
                ? taskRepository.countByUserIdAndStatus(task.getUser().getId(), Task.TaskStatus.DOING)
                : taskRepository.countByStatus(Task.TaskStatus.DOING);

            if (activeDoingCount >= 1) {
                log.warn("WIP Limit violation for user ID {}. Active DOING count: {}",
                    task.getUser() != null ? task.getUser().getId() : "anonymous", activeDoingCount);
                throw new WipLimitExceededException();
            }
        }

        // Cập nhật completedAt nếu chuyển sang DONE và thưởng +10 XP
        if (targetStatus == Task.TaskStatus.DONE && task.getStatus() != Task.TaskStatus.DONE) {
            task.setCompletedAt(Instant.now());
            if (task.getUser() != null) {
                streakService.recordActivity(task.getUser().getId(), 10);
            }
        } else if (targetStatus != Task.TaskStatus.DONE) {
            task.setCompletedAt(null);
            // Edge Case 10: Không trừ điểm XP khi kéo ngược từ DONE về hàng đợi (Zero Penalty Policy)
            log.info("Edge Case 10: Task ID {} moved back from DONE to {}. Preserving all previously awarded XP.", taskId, targetStatus);
        }

        task.setStatus(targetStatus);
        Task updated = taskRepository.save(task);
        log.info("Task ID: {} status updated to {}", taskId, targetStatus);
        return TaskResponse.fromEntity(updated);
    }

    @Override
    public TaskResponse getTaskById(UUID taskId) {
        return taskRepository.findById(taskId)
            .map(task -> {
                double pScore = energyPrioritizationEngine.calculatePriorityScore(task, task.getEnergyRequired(), Instant.now());
                boolean overdue = energyPrioritizationEngine.isOverdue(task, Instant.now());
                boolean dimmed = energyPrioritizationEngine.isDimmed(task, task.getEnergyRequired());
                return TaskResponse.fromEntity(task, pScore, overdue, dimmed);
            })
            .orElseThrow(() -> new ResourceNotFoundException("Nhiệm vụ", taskId));
    }

    @Override
    public List<TaskResponse> getAllTasks() {
        List<Task> tasks = taskRepository.findAllByOrderByCreatedAtDesc();
        return energyPrioritizationEngine.prioritizeAndMap(tasks, null, false);
    }

    @Override
    public List<TaskResponse> getTasksByStatus(Task.TaskStatus status) {
        List<Task> tasks = taskRepository.findByStatusOrderByPositionAsc(status);
        return energyPrioritizationEngine.prioritizeAndMap(tasks, null, false);
    }

    @Override
    public List<TaskResponse> getTasks(Task.TaskStatus status, Task.EnergyRequirement userEnergy, Boolean sortByPriority) {
        List<Task> rawTasks = (status != null)
                ? taskRepository.findByStatusOrderByPositionAsc(status)
                : taskRepository.findAllByOrderByCreatedAtDesc();

        return energyPrioritizationEngine.prioritizeAndMap(rawTasks, userEnergy, Boolean.TRUE.equals(sortByPriority));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteTask(UUID taskId) {
        if (!taskRepository.existsById(taskId)) {
            throw new ResourceNotFoundException("Nhiệm vụ", taskId);
        }
        taskRepository.deleteById(taskId);
        log.info("Deleted task ID: {}", taskId);
    }

    private User resolveUser(UUID userId) {
        if (userId != null) {
            return userRepository.findById(userId).orElse(null);
        }

        // Tạo hoặc lấy Demo User mặc định để bảo toàn khóa ngoại user_id
        return userRepository.findByEmail("demo@orbit.app").orElseGet(() ->
            userRepository.save(User.builder()
                .email("demo@orbit.app")
                .displayName("ADHD Explorer")
                .passwordHash("$2a$10$demoHashPlaceholderForOrbitDemoUser")
                .currentEnergyLevel(User.EnergyLevel.MEDIUM)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build()
            )
        );
    }
}
