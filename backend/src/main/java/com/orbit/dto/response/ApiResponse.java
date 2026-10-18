package com.orbit.dto.response;

import java.time.Instant;

/**
 * Chuẩn hóa cấu trúc phản hồi API cho toàn bộ hệ thống Orbit.
 *
 * @param success Trạng thái thành công của yêu cầu
 * @param data Dữ liệu trả về (Generic T)
 * @param message Thông điệp phản hồi thân thiện, đồng cảm
 * @param timestamp Thời điểm phát sinh phản hồi (ISO-8601)
 */
public record ApiResponse<T>(
    boolean success,
    T data,
    String message,
    Instant timestamp
) {
    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(true, data, message, Instant.now());
    }

    public static <T> ApiResponse<T> ok(T data) {
        return ok(data, "Thao tác thành công");
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, null, message, Instant.now());
    }
}
