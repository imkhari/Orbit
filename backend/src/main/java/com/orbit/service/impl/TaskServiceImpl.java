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
import com.orbit.service.TaskOwnership;
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
    private final TaskOwnership ownership;
    private final StreakService streakService;
    private final EnergyPrioritizationEngine energyPrioritizationEngine;
    private final com.orbit.repository.BoardRepository boardRepository;
    private final com.orbit.service.BoardService boardService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TaskResponse createTask(CreateTaskRequest request) {
        log.info("Creating new task with energy: {}", request.energyRequiredOrDefault());

        User user = ownership.account();

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
                board = boardRepository.findByIdAndUserId(request.boardId(), user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Bảng", request.boardId()));
            }
            if (board == null && boardService != null) {
                board = boardRepository.findFirstByUserIdAndIsArchivedFalseOrderByPositionAsc(user.getId())
                    .orElseGet(() -> {
                        var defaultBoards = boardService.getUserBoards(user.getId());
                        return !defaultBoards.isEmpty() ? boardRepository.findByIdAndUserId(defaultBoards.get(0).id(), user.getId()).orElse(null) : null;
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
        log.info("Task created successfully with ID: {}", saved.getId());
        return TaskResponse.fromEntity(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TaskResponse updateTaskStatus(UUID taskId, UpdateTaskStatusRequest request) {
        log.info("Updating status for task ID: {} to {}", taskId, request.status());

        Task task = ownership.require(taskId);

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

        Task task = ownership.require(taskId);

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
            var board = boardRepository.findByIdAndUserId(request.boardId(), task.getUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Bảng", request.boardId()));
            task.setBoard(board);
        }

        Task saved = taskRepository.save(task);
        log.info("Task ID: {} details updated successfully", taskId);
        return TaskResponse.fromEntity(saved);
    }

    @Override
    public TaskResponse getTaskById(UUID taskId) {
        Task task = ownership.require(taskId);
        Instant now = Instant.now();
        double score = energyPrioritizationEngine.calculatePriorityScore(task, task.getEnergyRequired(), now);
        boolean overdue = energyPrioritizationEngine.isOverdue(task, now);
        boolean dimmed = energyPrioritizationEngine.isDimmed(task, task.getEnergyRequired());
        return TaskResponse.fromEntity(task, score, overdue, dimmed);
    }

    @Override
    public List<TaskResponse> getAllTasks() {
        return getTasks(null, null, false);
    }

    @Override
    public List<TaskResponse> getTasksByStatus(Task.TaskStatus status) {
        return getTasks(status, null, false);
    }

    @Override
    public List<TaskResponse> getTasks(Task.TaskStatus status, Task.EnergyRequirement userEnergy, Boolean sortByPriority) {
        UUID accountId = ownership.account().getId();
        List<Task> rawTasks = status != null
                ? taskRepository.findByUserIdAndStatusOrderByPositionAsc(accountId, status)
                : taskRepository.findByUserIdOrderByCreatedAtDesc(accountId);
        return energyPrioritizationEngine.prioritizeAndMap(rawTasks, userEnergy, Boolean.TRUE.equals(sortByPriority));
    }

    @Override
    public List<TaskResponse> getTasksByBoard(UUID boardId) {
        return taskRepository.findByUserIdAndBoardIdOrderByPositionAsc(ownership.account().getId(), boardId)
            .stream()
            .map(TaskResponse::fromEntity)
            .toList();
    }

    @Override
    public List<TaskResponse> getTasksByBoardAndStatus(UUID boardId, Task.TaskStatus status) {
        return taskRepository.findByUserIdAndBoardIdAndStatusOrderByPositionAsc(ownership.account().getId(), boardId, status)
            .stream()
            .map(TaskResponse::fromEntity)
            .toList();
    }

    @Override
    public com.orbit.dto.response.RescueTaskResponse recommendRescueTask(com.orbit.dto.request.RescueTaskRequest request) {
        User user = ownership.account();
        Task.EnergyRequirement userEnergy = request != null ? request.currentEnergyOrDefault() : Task.EnergyRequirement.MEDIUM;
        int availableMinutes = request != null ? request.availableMinutesOrDefault() : 25;

        log.info("Computing ADHD Analysis Paralysis Rescue for user ID: {} (Energy: {}, Available: {}m)",
                user.getId(), userEnergy, availableMinutes);

        UUID boardId = request != null ? request.boardId() : null;
        List<Task> candidates = taskRepository.findByUserIdOrderByPositionAsc(user.getId()).stream()
            .filter(t -> t.getStatus() == Task.TaskStatus.TODO || t.getStatus() == Task.TaskStatus.BACKLOG)
            .filter(t -> boardId == null || (t.getBoard() != null && boardId.equals(t.getBoard().getId())))
            .toList();

        if (candidates.isEmpty()) {
            var activeDoing = taskRepository.findFirstByUserIdAndStatus(user.getId(), Task.TaskStatus.DOING);
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
        if (task.getSubtasks() != null) {
            var existing = task.getSubtasks().stream()
                .filter(s -> !Boolean.TRUE.equals(s.getIsCompleted()))
                .filter(s -> s.getEstimatedMinutes() != null
                    && s.getEstimatedMinutes() >= 1 && s.getEstimatedMinutes() < 5)
                .min(java.util.Comparator.comparingInt(s -> s.getStepOrder() != null ? s.getStepOrder() : 999));

            if (existing.isPresent()) {
                return existing.get();
            }
        }
        return com.orbit.entity.Subtask.builder()
            .task(task)
            .title("Chuẩn bị thứ đầu tiên bạn cần để bắt đầu việc này")
            .estimatedMinutes(3)
            .energyLevel(Task.EnergyRequirement.LOW)
            .stepOrder(1)
            .isCompleted(false)
            .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteTask(UUID taskId) {
        taskRepository.delete(ownership.require(taskId));
        log.info("Deleted task ID: {}", taskId);
    }
}
