package com.orbit.service;

import com.orbit.entity.Task;
import com.orbit.entity.User;
import com.orbit.exception.ResourceNotFoundException;
import com.orbit.repository.TaskRepository;
import com.orbit.security.CurrentAccount;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class TaskOwnership {
    private final TaskRepository tasks;

    public User account() {
        return CurrentAccount.require();
    }

    public Task require(UUID taskId) {
        return tasks.findByIdAndUserId(taskId, account().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Việc", taskId));
    }
}
