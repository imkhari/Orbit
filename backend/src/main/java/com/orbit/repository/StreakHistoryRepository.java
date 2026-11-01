package com.orbit.repository;

import com.orbit.entity.StreakHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StreakHistoryRepository extends JpaRepository<StreakHistory, UUID> {

    Optional<StreakHistory> findByUserId(UUID userId);

    Optional<StreakHistory> findByUserEmail(String email);
}
