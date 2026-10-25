package com.orbit.service;

import com.orbit.dto.response.AIDecomposeResponse;

import java.util.UUID;

/**
 * Service xử lý phân tích và bẻ nhỏ công việc bằng Trí Tuệ Nhân Tạo (AI Task Decomposition)
 * tuân thủ các nguyên tắc nhận thức ADHD (Edge Case 01 & 12).
 */
public interface AIService {

    /**
     * Bẻ nhỏ nhiệm vụ thành các vi bước (Subtasks) theo các nguyên tắc công thái học nhận thức ADHD
     * sử dụng Google Gemini 1.5 Flash (chế độ JSON structured output).
     *
     * Cơ chế Heuristic Fallback:
     * Nếu thời gian gọi vượt quá 3000ms hoặc lỗi mạng/quota, tự động kích hoạt Heuristic Fallback Engine
     * sinh ra 3 bước mồi phù hợp với isFallback: true.
     *
     * @param taskId ID nhiệm vụ cần phân rã
     * @return AIDecomposeResponse chứa danh sách gợi ý vi bước
     */
    AIDecomposeResponse decomposeTask(UUID taskId);
}
