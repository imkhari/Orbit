package com.orbit.repository;

import com.orbit.entity.FocusSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface FocusSessionRepository extends JpaRepository<FocusSession, UUID> {

    List<FocusSession> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<FocusSession> findByUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(UUID userId, Instant start, Instant end);
}
