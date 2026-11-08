package com.orbit.service;

import com.orbit.dto.request.CreateTaskRequest;
import com.orbit.dto.request.UpdateTaskStatusRequest;
import com.orbit.dto.response.TaskResponse;
import com.orbit.entity.Task;

import java.util.List;
import java.util.UUID;

public interface TaskService {

    /**
     * Tạo mới nhiệm vụ vào Backlog (Instant Task Capture <5s).
     * Hỗ trợ Edge Case 05: Tự động chia tách nếu nội dung tiêu đề dài > 100 ký tự.
     */
    TaskResponse createTask(CreateTaskRequest request);

    /**
     * Cập nhật trạng thái cột Kanban cho nhiệm vụ với ràng buộc đơn nhiệm (WIP = 1 ở cột DOING)
     * và hỗ trợ Edge Case 10: Chuyển ngược từ DONE về TODO bảo toàn Zero-Penalty XP.
     */
    TaskResponse updateTaskStatus(UUID taskId, UpdateTaskStatusRequest request);

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
     * Lấy danh sách nhiệm vụ có tính toán Điểm Ưu Tiên Năng Lượng Thích Ứng (Epic 5 & Edge Case 06).
     *
     * @param status Trạng thái cột cần lọc (optional)
     * @param userEnergy Mức năng lượng hiện tại của não bộ người dùng (LOW, MEDIUM, HIGH)
     * @param sortByPriority Có sắp xếp giảm dần theo điểm P(T) hay không
     * @return Danh sách nhiệm vụ kèm priorityScore, isOverdue, isDimmed
     */
    List<TaskResponse> getTasks(Task.TaskStatus status, Task.EnergyRequirement userEnergy, Boolean sortByPriority);

    /**
     * Xóa nhiệm vụ theo ID.
     */
    void deleteTask(UUID taskId);
}
