package com.orbit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orbit.dto.response.AIDecomposeResponse;
import com.orbit.entity.Task;
import com.orbit.repository.TaskRepository;
import com.orbit.service.impl.AIServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AIServiceTest {

    @Mock
    private TaskRepository taskRepository;

    private AIServiceImpl aiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        aiService = new AIServiceImpl(taskRepository, objectMapper);
    }

    @Test
    @DisplayName("Heuristic Fallback: Phân tích từ khóa 'Viết báo cáo' sinh 3 bước mồi chuẩn ADHD")
    void shouldGenerateFallbackForWritingTask() {
        UUID taskId = UUID.randomUUID();
        Task task = Task.builder()
                .id(taskId)
                .title("Viết báo cáo bài tập lớn AI")
                .description("Cần hoàn thành chương 1 và chương 2")
                .energyRequired(Task.EnergyRequirement.HIGH)
                .build();

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));

        AIDecomposeResponse response = aiService.decomposeTask(taskId);

        assertThat(response).isNotNull();
        assertThat(response.taskId()).isEqualTo(taskId);
        assertThat(response.isFallback()).isTrue();
        assertThat(response.suggestedSubtasks()).hasSize(3);

        // Quy tắc vàng 1: Bước 1 <= 5 phút (Starter step)
        var step1 = response.suggestedSubtasks().get(0);
        assertThat(step1.stepOrder()).isEqualTo(1);
        assertThat(step1.estimatedMinutes()).isLessThanOrEqualTo(5);
        assertThat(step1.isRecommendedStarter()).isTrue();
        assertThat(step1.title()).contains("soạn thảo");

        // Quy tắc vàng 2: Mọi bước <= 20 phút (Edge Case 12)
        response.suggestedSubtasks().forEach(step -> {
            assertThat(step.estimatedMinutes()).isLessThanOrEqualTo(20);
            assertThat(step.estimatedMinutes()).isGreaterThanOrEqualTo(1);
            assertThat(step.energyLevel()).isNotNull();
        });
    }

    @Test
    @DisplayName("Heuristic Fallback: Phân tích từ khóa 'Code backend' sinh bước mồi mở IDE")
    void shouldGenerateFallbackForCodingTask() {
        UUID taskId = UUID.randomUUID();
        Task task = Task.builder()
                .id(taskId)
                .title("Code REST API Spring Boot cho Orbit")
                .energyRequired(Task.EnergyRequirement.MEDIUM)
                .build();

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));

        AIDecomposeResponse response = aiService.decomposeTask(taskId);

        assertThat(response.isFallback()).isTrue();
        assertThat(response.suggestedSubtasks().get(0).title()).contains("IDE");
        assertThat(response.suggestedSubtasks().get(0).estimatedMinutes()).isLessThanOrEqualTo(5);
    }

    @Test
    @DisplayName("Heuristic Fallback: Phân tích từ khóa 'Dọn dẹp' sinh bước mồi uống nước bật nhạc")
    void shouldGenerateFallbackForCleaningTask() {
        UUID taskId = UUID.randomUUID();
        Task task = Task.builder()
                .id(taskId)
                .title("Dọn dẹp bàn làm việc và phòng ngủ")
                .energyRequired(Task.EnergyRequirement.LOW)
                .build();

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));

        AIDecomposeResponse response = aiService.decomposeTask(taskId);

        assertThat(response.isFallback()).isTrue();
        assertThat(response.suggestedSubtasks().get(0).title()).contains("nước");
        assertThat(response.suggestedSubtasks().get(0).estimatedMinutes()).isLessThanOrEqualTo(5);
    }

    @Test
    @DisplayName("JSON Parser: Phân tích thành công chuỗi JSON trả về từ Gemini và ép ràng buộc ADHD")
    void shouldParseGeminiJsonAndEnforceAdhdRules() {
        Task task = Task.builder()
                .id(UUID.randomUUID())
                .title("Tập thuyết trình seminar")
                .build();

        String rawGeminiResponse = """
                {
                  "candidates": [
                    {
                      "content": {
                        "parts": [
                          {
                            "text": "```json\\n{\\n  \\"reasoningSummary\\": \\"Hãy bắt đầu với 1 bước siêu nhỏ 4 phút nhé!\\",\\n  \\"subtasks\\": [\\n    {\\"stepOrder\\": 1, \\"title\\": \\"Mở file slide và xem trang bìa\\", \\"estimatedMinutes\\": 10, \\"energyLevel\\": \\"LOW\\"},\\n    {\\"stepOrder\\": 2, \\"title\\": \\"Tập nói 3 slide đầu tiên\\", \\"estimatedMinutes\\": 35, \\"energyLevel\\": \\"MEDIUM\\"},\\n    {\\"stepOrder\\": 3, \\"title\\": \\"Nghỉ ngơi và ghi lại chỗ vấp\\", \\"estimatedMinutes\\": 15, \\"energyLevel\\": \\"LOW\\"}\\n  ]\\n}\\n```"
                          }
                        ]
                      }
                    }
                  ]
                }
                """;

        AIDecomposeResponse response = aiService.parseGeminiResponse(task, rawGeminiResponse);

        assertThat(response.isFallback()).isFalse();
        assertThat(response.suggestedSubtasks()).hasSize(3);

        // Kiểm tra ép trần bước 1: Gemini trả 10p -> hệ thống tự động ép xuống 5p
        assertThat(response.suggestedSubtasks().get(0).estimatedMinutes()).isEqualTo(5);
        assertThat(response.suggestedSubtasks().get(0).isRecommendedStarter()).isTrue();

        // Kiểm tra ép trần bước 2: Gemini trả 35p -> hệ thống tự động ép xuống 20p (Edge Case 12)
        assertThat(response.suggestedSubtasks().get(1).estimatedMinutes()).isEqualTo(20);
    }
}
