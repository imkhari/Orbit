package com.orbit.service;

import com.orbit.dto.request.CreateBoardRequest;
import com.orbit.dto.request.UpdateBoardRequest;
import com.orbit.dto.response.BoardResponse;

import java.util.List;
import java.util.UUID;

public interface BoardService {

    /**
     * Lấy danh sách các bảng hoạt động của người dùng (tự động khởi tạo 3 bảng mẫu nếu chưa có bảng nào).
     */
    List<BoardResponse> getUserBoards(UUID userId);

    /**
     * Lấy thông tin chi tiết một bảng theo ID.
     */
    BoardResponse getBoardById(UUID userId, UUID boardId);

    /**
     * Tạo bảng mới với kiểm tra giới hạn Edge Case 07 (Tối đa 5 bảng hoạt động).
     */
    BoardResponse createBoard(UUID userId, CreateBoardRequest request);

    /**
     * Cập nhật thông tin bảng (tiêu đề, icon, vị trí, lưu trữ).
     */
    BoardResponse updateBoard(UUID userId, UUID boardId, UpdateBoardRequest request);

    /**
     * Lưu trữ (Archive) một bảng để giải phóng slot (Edge Case 07).
     */
    BoardResponse archiveBoard(UUID userId, UUID boardId);

    /**
     * Xóa vĩnh viễn bảng (Edge Case 11).
     */
    void deleteBoard(UUID userId, UUID boardId);
}
