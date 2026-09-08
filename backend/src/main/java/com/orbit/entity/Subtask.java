package com.orbit.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "subtasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subtask {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @Column(nullable = false)
    private String title;

    private Integer estimatedMinutes;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Task.EnergyRequirement energyLevel = Task.EnergyRequirement.LOW;

    @Builder.Default
    private Integer stepOrder = 1;

    @Builder.Default
    private Boolean isCompleted = false;

    private Instant completedAt;
}
