package com.orbit.repository;

import com.orbit.entity.Board;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BoardRepository extends JpaRepository<Board, UUID> {

    List<Board> findByUserIdAndIsArchivedFalseOrderByPositionAsc(UUID userId);

    List<Board> findByUserIdOrderByPositionAsc(UUID userId);

    long countByUserIdAndIsArchivedFalse(UUID userId);

    Optional<Board> findByIdAndUserId(UUID id, UUID userId);

    Optional<Board> findFirstByUserIdAndIsArchivedFalseOrderByPositionAsc(UUID userId);
}
