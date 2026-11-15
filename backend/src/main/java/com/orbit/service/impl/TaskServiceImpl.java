package com.orbit.service.impl;

import com.orbit.dto.request.CreateTaskRequest;
import com.orbit.dto.request.UpdateTaskRequest;
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
    private final com.orbit.repository.BoardRepository boardRepository;
    private final com.orbit.service.BoardService boardService;

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

        com.orbit.entity.Board board = null;
        if (boardRepository != null) {
            if (request.boardId() != null) {
                board = boardRepository.findById(request.boardId()).orElse(null);
            }
            if (board == null && boardService != null) {
                board = boardRepository.findFirstByUserIdAndIsArchivedFalseOrderByPositionAsc(user.getId())
                    .orElseGet(() -> {
                        var defaultBoards = boardService.getUserBoards(user.getId());
                        return !defaultBoards.isEmpty() ? boardRepository.findById(defaultBoards.get(0).id()).orElse(null) : null;
                    });
            }
        }

        Task task = Task.builder()
            .user(user)
            .board(board)
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
    @Transactional(rollbackFor = Exception.class)
    public TaskResponse updateTask(UUID taskId, UpdateTaskRequest request) {
        log.info("Updating task details for ID: {}", taskId);

        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Nhiệm vụ", taskId));

        if (request.title() != null && !request.title().isBlank()) {
            String rawTitle = request.title().trim();
            if (rawTitle.length() > 100 && (request.description() == null || request.description().isBlank())) {
                task.setTitle(rawTitle.substring(0, 100).trim());
                task.setDescription(rawTitle.substring(100).trim());
            } else {
                task.setTitle(rawTitle);
            }
        }
        if (request.description() != null) {
            task.setDescription(request.description().trim());
        }
        if (request.energyRequired() != null) {
            task.setEnergyRequired(request.energyRequired());
        }
        if (request.urgency() != null) {
            task.setUrgency(request.urgency());
        }
        if (request.estimatedMinutes() != null) {
            task.setEstimatedMinutes(request.estimatedMinutes());
        }
        if (request.deadline() != null) {
            task.setDeadline(request.deadline());
        }
        if (request.boardId() != null) {
            boardRepository.findById(request.boardId()).ifPresent(task::setBoard);
        }

        Task saved = taskRepository.save(task);
        log.info("Task ID: {} details updated successfully", taskId);
        return TaskResponse.fromEntity(saved);
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
    public List<TaskResponse> getTasksByBoard(UUID boardId) {
        return taskRepository.findByBoardIdOrderByPositionAsc(boardId).stream()
            .map(TaskResponse::fromEntity)
            .toList();
    }

    @Override
    public List<TaskResponse> getTasksByBoardAndStatus(UUID boardId, Task.TaskStatus status) {
        return taskRepository.findByBoardIdAndStatusOrderByPositionAsc(boardId, status).stream()
            .map(TaskResponse::fromEntity)
            .toList();
    }

    @Override
    public com.orbit.dto.response.RescueTaskResponse recommendRescueTask(com.orbit.dto.request.RescueTaskRequest request) {
        User user = resolveUser(null);
        Task.EnergyRequirement userEnergy = request != null ? request.currentEnergyOrDefault() : Task.EnergyRequirement.MEDIUM;
        int availableMinutes = request != null ? request.availableMinutesOrDefault() : 25;

        log.info("Computing ADHD Analysis Paralysis Rescue for user ID: {} (Energy: {}, Available: {}m)",
                user.getId(), userEnergy, availableMinutes);

        // 1. Tìm các candidate tasks từ TODO và BACKLOG
        List<Task> candidates;
        if (request != null && request.boardId() != null) {
            candidates = taskRepository.findByBoardIdOrderByPositionAsc(request.boardId()).stream()
                .filter(t -> t.getStatus() == Task.TaskStatus.TODO || t.getStatus() == Task.TaskStatus.BACKLOG)
                .toList();
        } else {
            candidates = taskRepository.findByUserIdOrderByPositionAsc(user.getId()).stream()
                .filter(t -> t.getStatus() == Task.TaskStatus.TODO || t.getStatus() == Task.TaskStatus.BACKLOG)
                .toList();
        }

        // Nếu người dùng chưa có task riêng, tìm trong toàn bộ task chưa hoàn thành
        if (candidates.isEmpty()) {
            candidates = taskRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(t -> t.getStatus() == Task.TaskStatus.TODO || t.getStatus() == Task.TaskStatus.BACKLOG)
                .toList();
        }

        if (candidates.isEmpty()) {
            // Kiểm tra xem có task nào đang nằm ở DOING không
            java.util.Optional<Task> activeDoing = taskRepository.findFirstByUserIdAndStatus(user.getId(), Task.TaskStatus.DOING);
            if (activeDoing.isEmpty()) {
                activeDoing = taskRepository.findFirstByStatus(Task.TaskStatus.DOING);
            }
            if (activeDoing.isPresent()) {
                Task doingTask = activeDoing.get();
                com.orbit.entity.Subtask starter = getOrFindStarterSubtask(doingTask);
                return new com.orbit.dto.response.RescueTaskResponse(
                    TaskResponse.fromEntity(doingTask, 100.0, false, false),
                    starter != null ? com.orbit.dto.response.SubtaskResponse.fromEntity(starter) : null,
                    "Bạn đang có 1 việc trong tiến trình tập trung! Hãy cùng hoàn thành nó nhé 🌿",
                    "Nhiệm vụ này đã được chọn vào tiêu điểm DOING của bạn.",
                    100.0
                );
            }
            return null;
        }

        // 2. Tính điểm ưu tiên P(T) và tính fit-bonus với thời gian rảnh
        Instant now = Instant.now();
        Task bestTask = null;
        double maxScore = -1.0;

        for (Task task : candidates) {
            double score = energyPrioritizationEngine.calculatePriorityScore(task, userEnergy, now);

            // Thưởng điểm nếu thời lượng task vừa vặn với thời gian rảnh
            if (task.getEstimatedMinutes() != null && task.getEstimatedMinutes() <= availableMinutes) {
                score += 15.0; // Fit bonus
            } else if (task.getEstimatedMinutes() != null && task.getEstimatedMinutes() > availableMinutes * 2) {
                score -= 20.0; // Too long penalty
            }

            // Ưu tiên TODO hơn BACKLOG một chút
            if (task.getStatus() == Task.TaskStatus.TODO) {
                score += 5.0;
            }

            if (score > maxScore) {
                maxScore = score;
                bestTask = task;
            }
        }

        if (bestTask == null) {
            bestTask = candidates.get(0);
            maxScore = 50.0;
        }

        // 3. Tìm hoặc sinh starter micro-step (< 5 phút)
        com.orbit.entity.Subtask starter = getOrFindStarterSubtask(bestTask);

        // 4. Lời giải thích tâm lý dịu dàng
        boolean isOverdue = energyPrioritizationEngine.isOverdue(bestTask, now);
        String whyRecommended;
        if (bestTask.getEnergyRequired() == userEnergy) {
            whyRecommended = "Hoàn hảo với thể trạng năng lượng " + userEnergy.name() + " hiện tại của bạn.";
        } else if (isOverdue) {
            whyRecommended = "Đã qua ngày dự kiến — hoàn thành ngay sẽ giúp tâm trí bạn nhẹ nhõm hơn.";
        } else {
            whyRecommended = "Một nhiệm vụ vừa sức được thuật toán P(T) lựa chọn để tạo đà Dopamine.";
        }

        String gentleEncouragement = "Đừng nghĩ về toàn bộ nhiệm vụ to lớn! Bạn chỉ cần làm bước nhỏ này trong vài phút thôi. Bắt đầu nhẹ nhàng nhé! 🌿";

        TaskResponse taskResponse = TaskResponse.fromEntity(
            bestTask,
            Math.min(100.0, Math.max(0.0, maxScore)),
            isOverdue,
            energyPrioritizationEngine.isDimmed(bestTask, userEnergy)
        );

        return new com.orbit.dto.response.RescueTaskResponse(
            taskResponse,
            starter != null ? com.orbit.dto.response.SubtaskResponse.fromEntity(starter) : null,
            gentleEncouragement,
            whyRecommended,
            Math.min(100.0, Math.max(0.0, maxScore))
        );
    }

    private com.orbit.entity.Subtask getOrFindStarterSubtask(Task task) {
        if (task.getSubtasks() != null && !task.getSubtasks().isEmpty()) {
            return task.getSubtasks().stream()
                .filter(s -> !Boolean.TRUE.equals(s.getIsCompleted()))
                .min(java.util.Comparator.comparingInt(s -> s.getStepOrder() != null ? s.getStepOrder() : 999))
                .orElse(task.getSubtasks().get(0));
        }
        return com.orbit.entity.Subtask.builder()
            .task(task)
            .title("Mở tài liệu và đọc lướt 2 phút để lấy đà")
            .estimatedMinutes(3)
            .energyLevel(task.getEnergyRequired())
            .stepOrder(1)
            .isCompleted(false)
            .build();
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

        org.springframework.security.core.Authentication auth =
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User user) {
            return user;
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
