package com.orbit.repository;

import com.orbit.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {

    /**
     * Đếm số lượng nhiệm vụ của một người dùng theo trạng thái cột Kanban.
     * Sử dụng để kiểm tra ràng buộc đơn nhiệm (WIP Limit = 1 ở cột DOING).
     */
    long countByUserIdAndStatus(UUID userId, Task.TaskStatus status);

    /**
     * Đếm tổng số lượng nhiệm vụ theo trạng thái khi không chỉ định người dùng.
     */
    long countByStatus(Task.TaskStatus status);

    /**
     * Lấy danh sách nhiệm vụ của người dùng theo thứ tự vị trí hiển thị.
     */
    List<Task> findByUserIdOrderByPositionAsc(UUID userId);

    /**
     * Lấy danh sách nhiệm vụ theo trạng thái và thứ tự vị trí, kèm vi bước (eager fetch để tránh N+1).
     */
    @Query("SELECT DISTINCT t FROM Task t LEFT JOIN FETCH t.subtasks WHERE t.status = :status ORDER BY t.position ASC")
    List<Task> findByStatusOrderByPositionAsc(@Param("status") Task.TaskStatus status);

    /**
     * Lấy toàn bộ nhiệm vụ sắp xếp theo thời điểm tạo mới nhất, kèm vi bước (eager fetch để tránh N+1).
     */
    @Query("SELECT DISTINCT t FROM Task t LEFT JOIN FETCH t.subtasks ORDER BY t.createdAt DESC")
    List<Task> findAllByOrderByCreatedAtDesc();
}
