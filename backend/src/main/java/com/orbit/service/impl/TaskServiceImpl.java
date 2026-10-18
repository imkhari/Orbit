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
import com.orbit.service.TaskService;
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

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TaskResponse createTask(CreateTaskRequest request) {
        log.info("Creating new task: '{}' with energy: {}", request.title(), request.energyRequiredOrDefault());

        User user = resolveUser(request.userId());

        Task task = Task.builder()
            .user(user)
            .title(request.title().trim())
            .description(request.description())
            .energyRequired(request.energyRequiredOrDefault())
            .urgency(request.urgencyOrDefault())
            .estimatedMinutes(request.estimatedMinutes())
            .status(Task.TaskStatus.BACKLOG)
            .position(0)
            .createdAt(Instant.now())
            .build();

        Task saved = taskRepository.save(task);
        log.info("Task created successfully with ID: {}", saved.getId());
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

        // Cập nhật completedAt nếu chuyển sang DONE
        if (targetStatus == Task.TaskStatus.DONE && task.getStatus() != Task.TaskStatus.DONE) {
            task.setCompletedAt(Instant.now());
        } else if (targetStatus != Task.TaskStatus.DONE) {
            task.setCompletedAt(null);
        }

        task.setStatus(targetStatus);
        Task updated = taskRepository.save(task);
        log.info("Task ID: {} status updated to {}", taskId, targetStatus);
        return TaskResponse.fromEntity(updated);
    }

    @Override
    public TaskResponse getTaskById(UUID taskId) {
        return taskRepository.findById(taskId)
            .map(TaskResponse::fromEntity)
            .orElseThrow(() -> new ResourceNotFoundException("Nhiệm vụ", taskId));
    }

    @Override
    public List<TaskResponse> getAllTasks() {
        return taskRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(TaskResponse::fromEntity)
            .toList();
    }

    @Override
    public List<TaskResponse> getTasksByStatus(Task.TaskStatus status) {
        return taskRepository.findByStatusOrderByPositionAsc(status).stream()
            .map(TaskResponse::fromEntity)
            .toList();
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
