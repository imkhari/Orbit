package com.orbit.dto.response;

import java.util.UUID;

/**
 * Phản hồi giải cứu trạng thái tê liệt não: Đề xuất duy nhất 1 nhiệm vụ hoàn hảo nhất
 * kèm 1 vi bước khởi động (< 5 phút) và thông điệp tâm lý dịu dàng.
 */
public record RescueTaskResponse(
    TaskResponse task,
    SubtaskResponse starterSubtask,
    String gentleEncouragement,
    String whyRecommended,
    Double priorityScore
) {}
