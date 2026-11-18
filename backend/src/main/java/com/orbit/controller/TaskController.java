package com.orbit.controller;

import com.orbit.dto.request.CreateTaskRequest;
import com.orbit.dto.request.UpdateTaskRequest;
import com.orbit.dto.request.UpdateTaskStatusRequest;
import com.orbit.dto.response.ApiResponse;
import com.orbit.dto.response.TaskResponse;
import com.orbit.entity.Task;
import com.orbit.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class TaskController {

    private final TaskService taskService;
    private final com.orbit.service.AIService aiService;
    private final com.orbit.service.SubtaskService subtaskService;

    /**
     * Gợi ý 3–5 bước từ Gemini hoặc gợi ý nhanh khi không kết nối được.
     */
    @PostMapping("/{id}/ai-decompose")
    public ResponseEntity<ApiResponse<com.orbit.dto.response.AIDecomposeResponse>> decomposeTaskWithAI(
        @PathVariable UUID id,
        @RequestParam(defaultValue = "vi") String language
    ) {
        log.info("REST request to decompose task ID {} using AI", id);
        var response = aiService.decomposeTask(id, "en".equalsIgnoreCase(language));
        return ResponseEntity.ok(ApiResponse.ok(response, response.reasoningSummary()));
    }

    /**
     * Lưu hàng loạt các vi bước đã được người dùng phê duyệt vào Database (POST /api/v1/tasks/{id}/subtasks/bulk).
     */
    @PostMapping("/{id}/subtasks/bulk")
    public ResponseEntity<ApiResponse<TaskResponse>> saveBulkSubtasks(
        @PathVariable UUID id,
        @Valid @RequestBody com.orbit.dto.request.BulkSubtasksRequest request
    ) {
        log.info("REST request to bulk save {} subtasks for task ID {}", request.subtasks().size(), id);
        TaskResponse response = subtaskService.saveBulkSubtasks(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(response, "Đã lưu danh sách các vi bước vào nhiệm vụ thành công!"));
    }

    /**
     * Đánh dấu hoàn thành / chưa hoàn thành cho một vi bước (PATCH /api/v1/tasks/{taskId}/subtasks/{subtaskId}/toggle).
     */
    @PatchMapping("/{taskId}/subtasks/{subtaskId}/toggle")
    public ResponseEntity<ApiResponse<com.orbit.dto.response.SubtaskResponse>> toggleSubtask(
        @PathVariable UUID taskId,
        @PathVariable UUID subtaskId
    ) {
        log.info("REST request to toggle subtask ID {} for task ID {}", subtaskId, taskId);
        com.orbit.dto.response.SubtaskResponse response = subtaskService.toggleSubtask(taskId, subtaskId);
        String message = Boolean.TRUE.equals(response.isCompleted())
            ? "Tuyệt vời! Bạn vừa hoàn thành một vi bước (Dopamine Ignition)!"
            : "Đã đánh dấu vi bước chưa hoàn thành.";
        return ResponseEntity.ok(ApiResponse.ok(response, message));
    }

    /**
     * Lấy danh sách vi bước của một nhiệm vụ.
     */
    @GetMapping("/{id}/subtasks")
    public ResponseEntity<ApiResponse<List<com.orbit.dto.response.SubtaskResponse>>> getSubtasks(
        @PathVariable UUID id
    ) {
        List<com.orbit.dto.response.SubtaskResponse> subtasks = subtaskService.getSubtasksByTaskId(id);
        return ResponseEntity.ok(ApiResponse.ok(subtasks, "Lấy danh sách vi bước thành công"));
    }

    /**
     * Ghi nhận nhiệm vụ tức thời vào Backlog (Instant Task Capture <5s).
     * Hỗ trợ Edge Case 05: Tự động chia tách tiêu đề dài mà không làm gián đoạn dòng suy nghĩ.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(@Valid @RequestBody CreateTaskRequest request) {
        TaskResponse response = taskService.createTask(request);
        String message = (request.title().trim().length() > 100)
            ? "Orbit đã giúp bạn tóm gọn tiêu đề và lưu phần chi tiết còn lại vào mục ghi chú rồi nhé! 🌿"
            : "Nhiệm vụ đã được ghi nhận an toàn vào Backlog!";
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(response, message));
    }

    /**
     * Cập nhật thông tin chi tiết nhiệm vụ (tiêu đề, ghi chú, năng lượng, deadline, thời lượng ước tính).
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateTaskRequest request
    ) {
        log.info("REST request to update task details for ID {}", id);
        TaskResponse response = taskService.updateTask(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Nhiệm vụ đã được cập nhật thành công!"));
    }

    /**
     * Cập nhật trạng thái cột Kanban của nhiệm vụ với kiểm tra giới hạn đơn nhiệm (WIP = 1).
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTaskStatus(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateTaskStatusRequest request
    ) {
        log.info("REST request to transition task ID {} to status {}", id, request.status());
        TaskResponse response = taskService.updateTaskStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Trạng thái nhiệm vụ đã được cập nhật thành công!"));
    }

    /**
     * Lấy danh sách nhiệm vụ (hỗ trợ lọc theo trạng thái cột Kanban, theo bảng, và theo mức năng lượng nhận thức).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getTasks(
        @RequestParam(required = false) Task.TaskStatus status,
        @RequestParam(required = false) UUID boardId,
        @RequestParam(required = false) Task.EnergyRequirement userEnergy,
        @RequestParam(required = false, defaultValue = "false") Boolean sortByPriority
    ) {
        List<TaskResponse> tasks;
        if (boardId != null) {
            tasks = (status != null)
                ? taskService.getTasksByBoardAndStatus(boardId, status)
                : taskService.getTasksByBoard(boardId);
        } else {
            tasks = taskService.getTasks(status, userEnergy, sortByPriority);
        }
        return ResponseEntity.ok(ApiResponse.ok(tasks, "Lấy danh sách nhiệm vụ thành công"));
    }

    /**
     * Lấy danh sách nhiệm vụ đã được tính toán điểm ưu tiên và sắp xếp thích ứng theo mức năng lượng não bộ (Epic 5 & Edge Case 06).
     */
    @GetMapping("/prioritized")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getPrioritizedTasks(
        @RequestParam(required = false, defaultValue = "MEDIUM") Task.EnergyRequirement userEnergy,
        @RequestParam(required = false, defaultValue = "TODO") Task.TaskStatus status
    ) {
        List<TaskResponse> tasks = taskService.getTasks(status, userEnergy, true);
        return ResponseEntity.ok(ApiResponse.ok(tasks, "Danh sách nhiệm vụ đã được sắp xếp ưu tiên theo thể trạng năng lượng"));
    }

    /**
     * Giải cứu người dùng khỏi trạng thái tê liệt nhận thức (Analysis Paralysis Rescue):
     * Thuật toán P(T) tự động chọn DUY NHẤT 1 việc tối ưu nhất kèm vi bước khởi động (< 5 phút).
     */
    @PostMapping("/rescue")
    public ResponseEntity<ApiResponse<com.orbit.dto.response.RescueTaskResponse>> recommendRescueTask(
        @RequestBody(required = false) com.orbit.dto.request.RescueTaskRequest request
    ) {
        log.info("REST request for ADHD Analysis Paralysis Rescue with energy: {}",
            request != null ? request.currentEnergy() : "DEFAULT");
        com.orbit.dto.response.RescueTaskResponse response = taskService.recommendRescueTask(
            request != null ? request : new com.orbit.dto.request.RescueTaskRequest(null, null, null)
        );
        return ResponseEntity.ok(ApiResponse.ok(response, "Orbit đã tìm thấy nhiệm vụ khởi động nhẹ nhàng nhất cho bạn! 🌿"));
    }

    /**
     * Lấy thông tin chi tiết nhiệm vụ theo ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> getTaskById(@PathVariable UUID id) {
        TaskResponse response = taskService.getTaskById(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Lấy thông tin nhiệm vụ thành công"));
    }

    /**
     * Xóa nhiệm vụ theo ID.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable UUID id) {
        taskService.deleteTask(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Nhiệm vụ đã được xóa thành công"));
    }
}
