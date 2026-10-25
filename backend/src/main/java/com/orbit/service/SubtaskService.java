package com.orbit.service;

import com.orbit.dto.request.BulkSubtasksRequest;
import com.orbit.dto.response.SubtaskResponse;
import com.orbit.dto.response.TaskResponse;

import java.util.List;
import java.util.UUID;

/**
 * Service quản lý vi bước (Subtasks) và các thao tác check-off hoàn thành.
 */
public interface SubtaskService {

    /**
     * Lưu danh sách các bước con (Subtasks) đã được người dùng phê duyệt vào Database.
     *
     * @param taskId ID nhiệm vụ gốc
     * @param request Danh sách vi bước cần lưu
     * @return TaskResponse cập nhật kèm số lượng subtasks
     */
    TaskResponse saveBulkSubtasks(UUID taskId, BulkSubtasksRequest request);

    /**
     * Đánh dấu hoàn thành / chưa hoàn thành cho một vi bước (Check-off dopamine ignition).
     *
     * @param taskId ID nhiệm vụ gốc
     * @param subtaskId ID vi bước cần toggle
     * @return SubtaskResponse sau khi cập nhật trạng thái
     */
    SubtaskResponse toggleSubtask(UUID taskId, UUID subtaskId);

    /**
     * Lấy danh sách vi bước của một nhiệm vụ.
     *
     * @param taskId ID nhiệm vụ gốc
     * @return Danh sách SubtaskResponse sắp xếp theo stepOrder
     */
    List<SubtaskResponse> getSubtasksByTaskId(UUID taskId);
}
