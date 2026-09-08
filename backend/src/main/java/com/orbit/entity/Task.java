package com.orbit.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TaskStatus status = TaskStatus.BACKLOG;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UrgencyLevel urgency = UrgencyLevel.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EnergyRequirement energyRequired = EnergyRequirement.MEDIUM;

    private Instant deadline;

    private Integer estimatedMinutes;

    @Builder.Default
    private Integer position = 0;

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Subtask> subtasks = new ArrayList<>();

    @Builder.Default
    private Instant createdAt = Instant.now();

    private Instant completedAt;

    public enum TaskStatus {
        BACKLOG,
        TODO,
        DOING,
        DONE
    }

    public enum UrgencyLevel {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    public enum EnergyRequirement {
        LOW,
        MEDIUM,
        HIGH
    }
}
