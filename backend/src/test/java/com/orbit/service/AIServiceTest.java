package com.orbit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orbit.dto.response.AIDecomposeResponse;
import com.orbit.entity.Task;
import com.orbit.service.impl.AIServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

@ExtendWith(MockitoExtension.class)
class AIServiceTest {
    private final ObjectMapper json = new ObjectMapper();
    @Mock private TaskOwnership ownership;
    private AIServiceImpl service;
    private MockRestServiceServer gemini;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://generativelanguage.googleapis.com");
        gemini = MockRestServiceServer.bindTo(builder).build();
        service = new AIServiceImpl(ownership, json, builder.build());
        ReflectionTestUtils.setField(service, "modelName", "gemini-3.5-flash-lite");
    }

    @AfterEach
    void close() {
        service.stop();
    }

    @Test
    void picksBilingualFallbackBasedOnTaskTitleWhenKeyIsAbsent() {
        Task writing = task("Viết báo cáo AI", "Chương 2");
        Task study = task("Học TOPIK", "Ôn từ vựng bài 3");
        AIDecomposeResponse vietnamese = service.decomposeTask(writing.getId(), false);
        AIDecomposeResponse english = service.decomposeTask(study.getId(), true);
        assertThat(vietnamese.isFallback()).isTrue();
        assertThat(english.isFallback()).isTrue();
        assertThat(vietnamese.suggestedSubtasks().get(0).title()).contains("soạn thảo");
        assertThat(english.suggestedSubtasks().get(0).title()).contains("study material");
        assertThat(english.suggestedSubtasks()).hasSize(3);
    }

    @Test
    void usesStructuredProviderOutputAndSendsOnlyRelevantTaskContent() throws Exception {
        useMockKey();
        Task task = task("Học TOPIK", "Ôn từ vựng bài 3");
        gemini.expect(requestTo("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent"))
                .andExpect(header("x-goog-api-key", "mock-key"))
                .andExpect(jsonPath("$.generationConfig.responseJsonSchema.properties.subtasks.minItems").value(3))
                .andExpect(jsonPath("$.systemInstruction.parts[0].text").value(containsString("in English")))
                .andExpect(jsonPath("$.contents[0].parts[0].text").value(containsString("Ôn từ vựng bài 3")))
                .andRespond(withSuccess(response("Open lesson 3 and mark five words", 3), MediaType.APPLICATION_JSON));
        AIDecomposeResponse result = service.decomposeTask(task.getId(), true);
        assertThat(result.isFallback()).isFalse();
        assertThat(result.suggestedSubtasks()).hasSize(3);
        assertThat(result.suggestedSubtasks().get(0).title()).contains("lesson 3");
        assertThat(result.suggestedSubtasks().get(0).isRecommendedStarter()).isTrue();
        assertThat(result.estimatedTotalMinutes()).isEqualTo(16);
        gemini.verify();
    }

    @Test
    void keepsTheVietnameseStarterForADifferentKindOfTask() throws Exception {
        useMockKey();
        Task task = task("Dọn phòng", "Bắt đầu ở ngăn bàn");
        gemini.expect(requestTo("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent"))
                .andExpect(jsonPath("$.systemInstruction.parts[0].text").value(containsString("in Vietnamese")))
                .andExpect(jsonPath("$.contents[0].parts[0].text").value(containsString("ngăn bàn")))
                .andRespond(withSuccess(response("Mở ngăn bàn và lấy giấy vụn ra", 2), MediaType.APPLICATION_JSON));
        AIDecomposeResponse result = service.decomposeTask(task.getId(), false);
        assertThat(result.isFallback()).isFalse();
        assertThat(result.suggestedSubtasks().get(0).title()).contains("ngăn bàn");
        gemini.verify();
    }

    @Test
    void fallsBackWhenProviderInventsAnOverlongStarter() throws Exception {
        useMockKey();
        Task task = task("Dọn phòng", "Bắt đầu ở bàn");
        gemini.expect(requestTo("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent"))
                .andRespond(withSuccess(response("Dọn cả phòng", 15), MediaType.APPLICATION_JSON));
        AIDecomposeResponse result = service.decomposeTask(task.getId(), false);
        assertThat(result.isFallback()).isTrue();
        assertThat(result.suggestedSubtasks().get(0).estimatedMinutes()).isBetween(1, 4);
        assertThat(result.suggestedSubtasks().get(0).title()).contains("góc nhỏ");
        gemini.verify();
    }

    @Test
    void returnsFallbackWhileProviderIsStillResponding() throws Exception {
        useMockKey();
        Task task = task("Write an email", "Send a meeting recap");
        ReflectionTestUtils.setField(service, "timeoutMs", 150L);
        var waiting = withSuccess(response("Open an email draft", 2), MediaType.APPLICATION_JSON);
        gemini.expect(requestTo("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent"))
                .andRespond(request -> {
                    try { Thread.sleep(2000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                    return waiting.createResponse(request);
                });
        AIDecomposeResponse result = service.decomposeTask(task.getId(), true);
        assertThat(result.isFallback()).isTrue();
        assertThat(result.suggestedSubtasks()).hasSize(3);
    }

    private void useMockKey() {
        ReflectionTestUtils.setField(service, "apiKey", "mock-key");
    }

    private Task task(String title, String notes) {
        Task task = Task.builder().id(UUID.randomUUID()).title(title).description(notes)
                .energyRequired(Task.EnergyRequirement.LOW).build();
        when(ownership.require(task.getId())).thenReturn(task);
        return task;
    }

    private String response(String starter, int firstMinutes) throws Exception {
        String content = json.writeValueAsString(Map.of("subtasks", List.of(
                Map.of("title", starter, "estimatedMinutes", firstMinutes, "energyLevel", "LOW"),
                Map.of("title", "Review the selected material", "estimatedMinutes", 8, "energyLevel", "MEDIUM"),
                Map.of("title", "Write a short recap", "estimatedMinutes", 5, "energyLevel", "LOW"))));
        return json.writeValueAsString(Map.of("candidates", List.of(Map.of(
                "finishReason", "STOP", "content", Map.of("parts", List.of(Map.of("text", content)))))));
    }
}
