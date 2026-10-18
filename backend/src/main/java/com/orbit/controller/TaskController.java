package com.orbit.controller;

import com.orbit.dto.request.CreateTaskRequest;
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

    /**
     * Ghi nhận nhiệm vụ tức thời vào Backlog (Instant Task Capture <5s).
     */
    @PostMapping
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(@Valid @RequestBody CreateTaskRequest request) {
        log.info("REST request to create task: '{}'", request.title());
        TaskResponse response = taskService.createTask(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(response, "Nhiệm vụ đã được ghi nhận an toàn vào Backlog!"));
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
     * Lấy danh sách nhiệm vụ (hỗ trợ lọc theo trạng thái cột Kanban).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getTasks(
        @RequestParam(required = false) Task.TaskStatus status
    ) {
        List<TaskResponse> tasks = (status != null)
            ? taskService.getTasksByStatus(status)
            : taskService.getAllTasks();

        return ResponseEntity.ok(ApiResponse.ok(tasks, "Lấy danh sách nhiệm vụ thành công"));
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
