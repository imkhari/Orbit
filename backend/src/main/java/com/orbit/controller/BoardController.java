package com.orbit.controller;

import com.orbit.security.CurrentAccount;
import com.orbit.dto.request.CreateBoardRequest;
import com.orbit.dto.request.UpdateBoardRequest;
import com.orbit.dto.response.ApiResponse;
import com.orbit.dto.response.BoardResponse;
import com.orbit.entity.User;
import com.orbit.service.BoardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/boards")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BoardController {

    private final BoardService boardService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BoardResponse>>> getUserBoards(
        @RequestParam(defaultValue = "false") boolean includeArchived
    ) {
        User user = CurrentAccount.require();
        List<BoardResponse> boards = boardService.getUserBoards(user.getId(), includeArchived);
        return ResponseEntity.ok(ApiResponse.ok(boards, "Lấy danh sách bảng thành công"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BoardResponse>> getBoardById(@PathVariable UUID id) {
        User user = CurrentAccount.require();
        BoardResponse response = boardService.getBoardById(user.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Lấy thông tin bảng thành công"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BoardResponse>> createBoard(@Valid @RequestBody CreateBoardRequest request) {
        User user = CurrentAccount.require();
        log.info("REST request to create board '{}' for user ID {}", request.title(), user.getId());
        BoardResponse response = boardService.createBoard(user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(response, "Tạo bảng công việc mới thành công! 🌿"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BoardResponse>> updateBoard(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateBoardRequest request
    ) {
        User user = CurrentAccount.require();
        log.info("REST request to update board ID {}", id);
        BoardResponse response = boardService.updateBoard(user.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Cập nhật bảng thành công!"));
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<ApiResponse<BoardResponse>> archiveBoard(@PathVariable UUID id) {
        User user = CurrentAccount.require();
        log.info("REST request to archive board ID {}", id);
        BoardResponse response = boardService.archiveBoard(user.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Đã lưu trữ bảng thành công để giải phóng không gian 🌿"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBoard(@PathVariable UUID id) {
        User user = CurrentAccount.require();
        log.info("REST request to delete board ID {}", id);
        boardService.deleteBoard(user.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Đã xóa bảng công việc thành công"));
    }
}
