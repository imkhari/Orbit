package com.orbit.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.orbit.dto.response.AIDecomposeResponse;
import com.orbit.dto.response.AIDecomposeResponse.SuggestedSubtask;
import com.orbit.entity.Task;
import com.orbit.exception.ResourceNotFoundException;
import com.orbit.repository.TaskRepository;
import com.orbit.service.AIService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;

@Slf4j
@Service
@Transactional(readOnly = true)
public class AIServiceImpl implements AIService {

    private final TaskRepository taskRepository;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;
    private final ExecutorService executor;

    @Value("${orbit.ai.gemini.api-key:demo_key}")
    private String apiKey;

    @Value("${orbit.ai.gemini.model:gemini-1.5-flash}")
    private String modelName;

    @Value("${orbit.ai.gemini.timeout-ms:3000}")
    private long timeoutMs;

    public AIServiceImpl(TaskRepository taskRepository, ObjectMapper objectMapper) {
        this.taskRepository = taskRepository;
        this.objectMapper = objectMapper;
        this.executor = Executors.newCachedThreadPool();

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(3000));
        requestFactory.setReadTimeout(Duration.ofMillis(3000));

        this.restClient = RestClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com")
                .requestFactory(requestFactory)
                .build();
    }

    @Override
    public AIDecomposeResponse decomposeTask(UUID taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Nhiệm vụ không tồn tại với ID: " + taskId));

        log.info("Initiating AI Task Decomposition for task ID: '{}' - Title: '{}'", task.getId(), task.getTitle());

        // Nếu API Key là demo hoặc không có, lập tức kích hoạt Heuristic Fallback
        if (apiKey == null || apiKey.isBlank() || "demo_key".equalsIgnoreCase(apiKey)) {
            log.info("Gemini API key is unconfigured or in demo mode. Activating Heuristic Fallback Engine.");
            return generateFallback(task);
        }

        String prompt = buildPrompt(task);

        try {
            CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> executeGeminiRequest(prompt), executor);
            String rawJsonResponse = future.get(timeoutMs, TimeUnit.MILLISECONDS);

            AIDecomposeResponse response = parseGeminiResponse(task, rawJsonResponse);
            log.info("Successfully decomposed task '{}' into {} micro-steps via Gemini 1.5 Flash",
                    task.getId(), response.suggestedSubtasks().size());
            return response;
        } catch (TimeoutException e) {
            log.warn("Gemini API call timed out (> {}ms) for task ID: {}. Activating Heuristic Fallback.", timeoutMs, task.getId());
            return generateFallback(task);
        } catch (Exception e) {
            log.warn("Gemini API call encountered error ({}). Activating Heuristic Fallback for task ID: {}",
                    e.getMessage(), task.getId());
            return generateFallback(task);
        }
    }

    private String executeGeminiRequest(String prompt) {
        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", prompt)))
                ),
                "generationConfig", Map.of(
                        "response_mime_type", "application/json",
                        "temperature", 0.4
                )
        );

        return restClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/v1beta/models/{model}:generateContent")
                        .queryParam("key", apiKey)
                        .build(modelName))
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);
    }

    private String buildPrompt(Task task) {
        return """
                [SYSTEM INSTRUCTION]
                Bạn là một chuyên gia tâm lý học nhận thức và chuyên gia chia nhỏ công việc dành cho người mắc chứng ADHD (Rối loạn Giảm chú ý / Tăng động).
                Nhiệm vụ của bạn là nhận vào một công việc và phân rã thành từ 3 đến 5 bước hành động vi mô cực kỳ cụ thể để người dùng vượt qua Tê liệt hành động (Task Paralysis).

                RÀNG BUỘC CÔNG THÁI HỌC TUYỆT ĐỐI (ADHD INVARIANTS):
                1. Bước 1 (Step 1) BẮT BUỘC là bước mồi (starter step) có estimatedMinutes <= 5, thao tác siêu dễ, bắt đầu bằng động từ cụ thể trực quan để kích hoạt dopamine ngay lập tức. Đánh dấu isRecommendedStarter: true.
                2. Tất cả các bước tiếp theo BẮT BUỘC có estimatedMinutes <= 20. Tuyệt đối không sinh bất kỳ bước nào vượt quá 20 phút.
                3. Tổng số lượng bước: Bắt buộc từ 3 đến 5 bước. Không được ít hơn 3 hoặc nhiều hơn 5 bước.
                4. Ngôn ngữ: Tiếng Việt, câu từ ấm áp, khích lệ, dịu dàng, rõ ràng, không dùng thuật ngữ phán xét hay trừu tượng.
                5. Gắn nhãn năng lượng (energyLevel): LOW, MEDIUM, hoặc HIGH phù hợp với nỗ lực nhận thức.
                6. ĐẦU RA BẮT BUỘC: Thuần JSON theo định dạng dưới đây, không kèm markdown hoặc giải thích thêm:
                {
                  "reasoningSummary": "Lời động viên nhận thức ngắn gọn giải thích cách chia nhẹ nhàng",
                  "subtasks": [
                    {
                      "stepOrder": 1,
                      "title": "Mô tả vi bước cụ thể bắt đầu bằng động từ",
                      "estimatedMinutes": 5,
                      "energyLevel": "LOW",
                      "isRecommendedStarter": true
                    }
                  ]
                }

                [USER TASK INPUT]
                - Tiêu đề: "%s"
                - Mô tả: "%s"
                - Mức năng lượng hiện tại: "%s"
                """.formatted(
                task.getTitle(),
                task.getDescription() != null ? task.getDescription() : "",
                task.getEnergyRequired() != null ? task.getEnergyRequired().name() : "MEDIUM"
        );
    }

    public AIDecomposeResponse parseGeminiResponse(Task task, String rawJsonResponse) {
        try {
            JsonNode root = objectMapper.readTree(rawJsonResponse);
            JsonNode candidates = root.path("candidates");
            if (candidates.isMissingNode() || candidates.isEmpty()) {
                log.warn("Gemini returned response without candidates, using fallback.");
                return generateFallback(task);
            }

            String contentText = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
            if (contentText == null || contentText.isBlank()) {
                return generateFallback(task);
            }

            // Dọn dẹp nếu có markdown ```json ... ```
            String cleanJson = contentText.trim();
            if (cleanJson.startsWith("```json")) {
                cleanJson = cleanJson.substring(7);
            }
            if (cleanJson.startsWith("```")) {
                cleanJson = cleanJson.substring(3);
            }
            if (cleanJson.endsWith("```")) {
                cleanJson = cleanJson.substring(0, cleanJson.length() - 3);
            }
            cleanJson = cleanJson.trim();

            JsonNode parsedObj = objectMapper.readTree(cleanJson);
            String reasoningSummary = parsedObj.path("reasoningSummary").asText(
                    "Thử thách này đã được gọt giũa thành các bước nhỏ dưới 20 phút. Hãy bắt đầu với bước 1 để tạo đà nhẹ nhàng nhé!"
            );

            JsonNode subtasksNode = parsedObj.path("subtasks");
            if (subtasksNode.isMissingNode() || !subtasksNode.isArray() || subtasksNode.size() < 2) {
                return generateFallback(task);
            }

            List<SuggestedSubtask> subtasks = new ArrayList<>();
            int order = 1;
            for (JsonNode node : subtasksNode) {
                if (order > 5) break; // Giới hạn tối đa 5 bước

                String title = node.path("title").asText("Vi bước " + order);
                int minutes = node.path("estimatedMinutes").asInt(15);
                // Ràng buộc ADHD: Bước 1 <= 5p, các bước khác <= 20p
                if (order == 1 && minutes > 5) {
                    minutes = 5;
                } else if (minutes > 20) {
                    minutes = 20;
                } else if (minutes < 1) {
                    minutes = 5;
                }

                String energyStr = node.path("energyLevel").asText("LOW").toUpperCase();
                Task.EnergyRequirement energyLevel;
                try {
                    energyLevel = Task.EnergyRequirement.valueOf(energyStr);
                } catch (IllegalArgumentException e) {
                    energyLevel = Task.EnergyRequirement.LOW;
                }

                boolean isStarter = (order == 1) || node.path("isRecommendedStarter").asBoolean(order == 1);

                subtasks.add(new SuggestedSubtask(order, title, minutes, energyLevel, isStarter));
                order++;
            }

            // Nếu số lượng bước < 3, bổ sung bước kết thúc nhẹ nhàng
            if (subtasks.size() < 3) {
                subtasks.add(new SuggestedSubtask(
                        subtasks.size() + 1,
                        "Rà soát lại kết quả và tự thưởng cho mình một cốc nước mát",
                        10,
                        Task.EnergyRequirement.LOW,
                        false
                ));
            }

            int totalMinutes = subtasks.stream().mapToInt(SuggestedSubtask::estimatedMinutes).sum();

            return new AIDecomposeResponse(
                    task.getId(),
                    totalMinutes,
                    false,
                    reasoningSummary,
                    subtasks
            );
        } catch (Exception e) {
            log.warn("Failed to parse Gemini structured JSON: {}. Using heuristic fallback.", e.getMessage());
            return generateFallback(task);
        }
    }

    /**
     * Cơ chế Heuristic Fallback Engine (Edge Case 01 & 12):
     * Phân tích từ khóa tiêu đề nhiệm vụ để sinh ra 3 vi bước mồi tối ưu theo nhận thức ADHD.
     */
    public AIDecomposeResponse generateFallback(Task task) {
        String titleLower = task.getTitle() != null ? task.getTitle().toLowerCase() : "";
        List<SuggestedSubtask> subtasks;

        if (titleLower.matches(".*(viết|soạn|báo cáo|tiểu luận|slide|thuyết trình|nộp bài).*")) {
            subtasks = List.of(
                    new SuggestedSubtask(1, "Mở ứng dụng soạn thảo và tạo file nháp mới", 3, Task.EnergyRequirement.LOW, true),
                    new SuggestedSubtask(2, "Gạch đầu dòng 3 ý chính cần thể hiện trong bài", 10, Task.EnergyRequirement.MEDIUM, false),
                    new SuggestedSubtask(3, "Viết đoạn mở đầu ngắn gọn 5 câu", 15, Task.EnergyRequirement.HIGH, false)
            );
        } else if (titleLower.matches(".*(học|ôn|đọc|nghiên cứu|sách|tài liệu|chương).*")) {
            subtasks = List.of(
                    new SuggestedSubtask(1, "Mở trang tài liệu và đọc lướt mục lục", 4, Task.EnergyRequirement.LOW, true),
                    new SuggestedSubtask(2, "Đọc sâu 3-5 trang trọng tâm đầu tiên", 15, Task.EnergyRequirement.MEDIUM, false),
                    new SuggestedSubtask(3, "Tóm tắt 2 ý quan trọng nhất vào giấy note", 10, Task.EnergyRequirement.HIGH, false)
            );
        } else if (titleLower.matches(".*(code|lập trình|bug|fix|test|dev|fe|be|api|spring|react).*")) {
            subtasks = List.of(
                    new SuggestedSubtask(1, "Mở IDE và checkout một nhánh mới sạch sẽ", 3, Task.EnergyRequirement.LOW, true),
                    new SuggestedSubtask(2, "Tái hiện bug hoặc viết 1 test case mẫu", 12, Task.EnergyRequirement.MEDIUM, false),
                    new SuggestedSubtask(3, "Sửa đoạn logic cốt lõi đầu tiên", 15, Task.EnergyRequirement.HIGH, false)
            );
        } else if (titleLower.matches(".*(dọn|nhà|phòng|bàn|vệ sinh|sắp xếp|rác).*")) {
            subtasks = List.of(
                    new SuggestedSubtask(1, "Uống một ngụm nước và bật bài nhạc yêu thích", 2, Task.EnergyRequirement.LOW, true),
                    new SuggestedSubtask(2, "Nhặt 5 món đồ bừa bộn nhất cất vào chỗ", 10, Task.EnergyRequirement.MEDIUM, false),
                    new SuggestedSubtask(3, "Quét dọn nhanh khu vực sàn chính", 15, Task.EnergyRequirement.HIGH, false)
            );
        } else {
            subtasks = List.of(
                    new SuggestedSubtask(1, "Dành 3 phút ngồi tĩnh tâm và hình dung kết quả", 3, Task.EnergyRequirement.LOW, true),
                    new SuggestedSubtask(2, "Liệt kê hành động nhỏ nhất có thể làm lúc này", 10, Task.EnergyRequirement.MEDIUM, false),
                    new SuggestedSubtask(3, "Thực hiện bước nhỏ đầu tiên vừa ghi ra", 15, Task.EnergyRequirement.HIGH, false)
            );
        }

        int totalMinutes = subtasks.stream().mapToInt(SuggestedSubtask::estimatedMinutes).sum();

        return new AIDecomposeResponse(
                task.getId(),
                totalMinutes,
                true,
                "Orbit đã chuẩn bị sẵn 3 bước khởi động vừa sức giúp bạn bắt nhịp thật nhẹ nhàng!",
                subtasks
        );
    }
}
