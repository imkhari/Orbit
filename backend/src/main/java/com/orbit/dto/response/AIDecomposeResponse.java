package com.orbit.dto.response;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.orbit.entity.Task;

import java.util.List;
import java.util.UUID;

/**
 * DTO chứa kết quả phân rã nhiệm vụ (AI Task Decomposition) từ Google Gemini 1.5 Flash
 * hoặc Heuristic Fallback Engine khi gặp sự cố mạng/timeout.
 */
public record AIDecomposeResponse(
        UUID taskId,
        Integer estimatedTotalMinutes,
        Boolean isFallback,
        String reasoningSummary,
        @JsonAlias("subtasks")
        List<SuggestedSubtask> suggestedSubtasks
) {
    public AIDecomposeResponse {
        if (estimatedTotalMinutes == null && suggestedSubtasks != null) {
            estimatedTotalMinutes = suggestedSubtasks.stream()
                    .filter(s -> s.estimatedMinutes() != null)
                    .mapToInt(SuggestedSubtask::estimatedMinutes)
                    .sum();
        }
        if (isFallback == null) {
            isFallback = false;
        }
    }

    /**
     * Vi bước gợi ý tuân thủ 4 quy tắc vàng nhận thức ADHD:
     * - Bước 1: Starter step <= 5 phút, isRecommendedStarter = true
     * - Mọi bước: <= 20 phút (Edge Case 12)
     * - Mức năng lượng: LOW, MEDIUM, HIGH
     */
    public record SuggestedSubtask(
            Integer stepOrder,
            String title,
            Integer estimatedMinutes,
            Task.EnergyRequirement energyLevel,
            Boolean isRecommendedStarter
    ) {
        public SuggestedSubtask {
            if (isRecommendedStarter == null) {
                isRecommendedStarter = (stepOrder != null && stepOrder == 1) || (estimatedMinutes != null && estimatedMinutes <= 5);
            }
            if (energyLevel == null) {
                energyLevel = Task.EnergyRequirement.LOW;
            }
        }
    }
}
