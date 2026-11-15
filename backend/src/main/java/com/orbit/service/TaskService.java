package com.orbit.service;

import com.orbit.dto.request.CreateTaskRequest;
import com.orbit.dto.request.UpdateTaskRequest;
import com.orbit.dto.request.UpdateTaskStatusRequest;
import com.orbit.dto.response.TaskResponse;
import com.orbit.entity.Task;

import java.util.List;
import java.util.UUID;

public interface TaskService {

    /**
     * Tạo mới nhiệm vụ vào Backlog (Instant Task Capture <5s).
     */
    TaskResponse createTask(CreateTaskRequest request);

    /**
     * Cập nhật trạng thái cột Kanban cho nhiệm vụ với ràng buộc đơn nhiệm (WIP = 1 ở cột DOING).
     */
    TaskResponse updateTaskStatus(UUID taskId, UpdateTaskStatusRequest request);

    /**
     * Cập nhật thông tin chi tiết nhiệm vụ (tiêu đề, ghi chú, mức năng lượng, độ khẩn cấp, deadline, thời lượng).
     */
    TaskResponse updateTask(UUID taskId, UpdateTaskRequest request);

    /**
     * Lấy thông tin chi tiết một nhiệm vụ theo ID.
     */
    TaskResponse getTaskById(UUID taskId);

    /**
     * Lấy danh sách toàn bộ nhiệm vụ sắp xếp theo thời gian tạo.
     */
    List<TaskResponse> getAllTasks();

    /**
     * Lấy danh sách nhiệm vụ theo trạng thái cột Kanban.
     */
    List<TaskResponse> getTasksByStatus(Task.TaskStatus status);

    /**
     * Lấy danh sách nhiệm vụ thuộc về một bảng cụ thể.
     */
    List<TaskResponse> getTasksByBoard(UUID boardId);

    /**
     * Lấy danh sách nhiệm vụ thuộc về một bảng và lọc theo trạng thái cột.
     */
    List<TaskResponse> getTasksByBoardAndStatus(UUID boardId, Task.TaskStatus status);

    /**
     * Xóa nhiệm vụ theo ID.
     */
    void deleteTask(UUID taskId);
}
