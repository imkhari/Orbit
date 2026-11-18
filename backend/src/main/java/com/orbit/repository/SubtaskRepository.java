package com.orbit.repository;

import com.orbit.entity.Subtask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubtaskRepository extends JpaRepository<Subtask, UUID> {

    Optional<Subtask> findByIdAndTaskId(UUID id, UUID taskId);

    List<Subtask> findByTaskIdOrderByStepOrderAsc(UUID taskId);

    void deleteByTaskId(UUID taskId);

    long countByTaskId(UUID taskId);

    long countByTaskIdAndIsCompletedTrue(UUID taskId);
}
