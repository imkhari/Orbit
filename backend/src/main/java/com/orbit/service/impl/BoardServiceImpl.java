package com.orbit.service.impl;

import com.orbit.dto.request.CreateBoardRequest;
import com.orbit.dto.request.UpdateBoardRequest;
import com.orbit.dto.response.BoardResponse;
import com.orbit.entity.Board;
import com.orbit.entity.Task;
import com.orbit.entity.User;
import com.orbit.exception.ResourceNotFoundException;
import com.orbit.repository.BoardRepository;
import com.orbit.repository.TaskRepository;
import com.orbit.repository.UserRepository;
import com.orbit.service.BoardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoardServiceImpl implements BoardService {

    private final BoardRepository boardRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    private static final int MAX_ACTIVE_BOARDS = 5;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<BoardResponse> getUserBoards(UUID userId) {
        User user = resolveUser(userId);

        List<Board> boards = boardRepository.findByUserIdAndIsArchivedFalseOrderByPositionAsc(user.getId());

        // Tự động khởi tạo 3 bảng mẫu nếu người dùng chưa có bảng nào (ADHD starter pack)
        if (boards.isEmpty()) {
            boards = initializeDefaultBoards(user);
        }

        return boards.stream()
            .map(this::mapToBoardResponse)
            .toList();
    }

    @Override
    public BoardResponse getBoardById(UUID userId, UUID boardId) {
        User user = resolveUser(userId);
        Board board = boardRepository.findByIdAndUserId(boardId, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Bảng công việc", boardId));

        return mapToBoardResponse(board);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BoardResponse createBoard(UUID userId, CreateBoardRequest request) {
        User user = resolveUser(userId);

        // Edge Case 07: Khóa trần tối đa 5 bảng hoạt động để chống phân tán tâm trí (Anti-procrastination)
        long activeBoardCount = boardRepository.countByUserIdAndIsArchivedFalse(user.getId());
        if (activeBoardCount >= MAX_ACTIVE_BOARDS) {
            log.warn("User ID {} exceeded max active boards limit (5)", user.getId());
            throw new IllegalArgumentException(
                "Không gian gọn gàng giúp tâm trí nhẹ nhõm! Bạn đang có 5 bảng hoạt động. Hãy lưu trữ bớt 1 bảng cũ để tạo bảng mới nhé. 🌿"
            );
        }

        Board board = Board.builder()
            .user(user)
            .title(request.title().trim())
            .icon(request.iconOrDefault())
            .colorTheme(request.colorThemeOrDefault())
            .position((int) activeBoardCount)
            .isArchived(false)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();

        Board saved = boardRepository.save(board);
        log.info("Created new board '{}' (ID: {}) for user ID: {}", saved.getTitle(), saved.getId(), user.getId());

        return mapToBoardResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BoardResponse updateBoard(UUID userId, UUID boardId, UpdateBoardRequest request) {
        User user = resolveUser(userId);
        Board board = boardRepository.findByIdAndUserId(boardId, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Bảng công việc", boardId));

        if (request.title() != null && !request.title().isBlank()) {
            board.setTitle(request.title().trim());
        }
        if (request.icon() != null && !request.icon().isBlank()) {
            board.setIcon(request.icon().trim());
        }
        if (request.colorTheme() != null && !request.colorTheme().isBlank()) {
            board.setColorTheme(request.colorTheme().trim());
        }
        if (request.position() != null) {
            board.setPosition(request.position());
        }
        if (request.isArchived() != null) {
            board.setIsArchived(request.isArchived());
        }

        board.setUpdatedAt(Instant.now());
        Board updated = boardRepository.save(board);
        log.info("Updated board ID: {}", boardId);

        return mapToBoardResponse(updated);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BoardResponse archiveBoard(UUID userId, UUID boardId) {
        User user = resolveUser(userId);
        Board board = boardRepository.findByIdAndUserId(boardId, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Bảng công việc", boardId));

        board.setIsArchived(true);
        board.setUpdatedAt(Instant.now());
        Board archived = boardRepository.save(board);
        log.info("Archived board ID: {} to free active slot", boardId);

        return mapToBoardResponse(archived);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteBoard(UUID userId, UUID boardId) {
        User user = resolveUser(userId);
        Board board = boardRepository.findByIdAndUserId(boardId, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Bảng công việc", boardId));

        boardRepository.delete(board);
        log.info("Deleted board ID: {}", boardId);
    }

    private BoardResponse mapToBoardResponse(Board board) {
        long totalTasks = taskRepository.countByBoardId(board.getId());
        long doingTasks = taskRepository.countByBoardIdAndStatus(board.getId(), Task.TaskStatus.DOING);
        long todoTasks = taskRepository.countByBoardIdAndStatus(board.getId(), Task.TaskStatus.TODO);

        return BoardResponse.fromEntity(board, totalTasks, doingTasks, todoTasks);
    }

    private List<Board> initializeDefaultBoards(User user) {
        log.info("Initializing 3 default ADHD-friendly boards for user ID: {}", user.getId());

        List<Board> defaultBoards = new ArrayList<>();
        defaultBoards.add(Board.builder()
            .user(user)
            .title("Học Tập & Nghiên Cứu")
            .icon("🎓")
            .colorTheme("sky")
            .position(0)
            .isArchived(false)
            .build());

        defaultBoards.add(Board.builder()
            .user(user)
            .title("Dự Án & Công Việc")
            .icon("💼")
            .colorTheme("amber")
            .position(1)
            .isArchived(false)
            .build());

        defaultBoards.add(Board.builder()
            .user(user)
            .title("Đời Sống & Việc Nhà")
            .icon("🏠")
            .colorTheme("emerald")
            .position(2)
            .isArchived(false)
            .build());

        List<Board> savedBoards = boardRepository.saveAll(defaultBoards);

        // Gán các nhiệm vụ cũ chưa có board_id vào bảng đầu tiên
        Board primaryBoard = savedBoards.get(0);
        List<Task> unassignedTasks = taskRepository.findByUserIdAndBoardIsNull(user.getId());
        if (!unassignedTasks.isEmpty()) {
            log.info("Assigning {} unassigned tasks to primary board '{}'", unassignedTasks.size(), primaryBoard.getTitle());
            for (Task t : unassignedTasks) {
                t.setBoard(primaryBoard);
            }
            taskRepository.saveAll(unassignedTasks);
        }

        return savedBoards;
    }

    private User resolveUser(UUID userId) {
        if (userId != null) {
            return userRepository.findById(userId).orElseGet(this::getOrCreateDemoUser);
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User user) {
            return user;
        }

        return getOrCreateDemoUser();
    }

    private User getOrCreateDemoUser() {
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
