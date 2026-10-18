package com.orbit.exception;

import com.orbit.dto.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Bắt lỗi vi phạm giới hạn đơn nhiệm (WIP Limit = 1 ở cột DOING).
     * Trả về HTTP 409 Conflict với thông điệp nhẹ nhàng, trấn an và hỗ trợ nhận thức.
     */
    @ExceptionHandler(WipLimitExceededException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleWipLimitExceeded(WipLimitExceededException ex) {
        log.warn("WIP Limit violation intercepted: {}", ex.getMessage());

        Map<String, Object> errorDetails = Map.of(
            "rule", "SINGLE_TASK_WIP_LIMIT",
            "limit", 1,
            "column", "DOING",
            "actionRequired", "Hoàn thành hoặc chuyển task hiện tại về Todo"
        );

        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(new ApiResponse<>(
                false,
                errorDetails,
                ex.getMessage(),
                java.time.Instant.now()
            ));
    }

    /**
     * Bắt lỗi dữ liệu đầu vào không hợp lệ (@Valid DTO validation).
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        log.warn("Validation failed for request: {}", errors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ApiResponse<>(
                false,
                errors,
                "Dữ liệu đầu vào không hợp lệ. Vui lòng kiểm tra lại các trường thông tin.",
                java.time.Instant.now()
            ));
    }

    /**
     * Bắt lỗi không tìm thấy tài nguyên (HTTP 404).
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Bắt lỗi JSON không đọc được (Enum không hợp lệ, cú pháp sai).
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleMalformedJson(HttpMessageNotReadableException ex) {
        log.warn("Malformed JSON or invalid enum value: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error("Định dạng dữ liệu gửi lên không hợp lệ hoặc giá trị Enum không đúng chuẩn."));
    }

    /**
     * Bắt lỗi hệ thống chung — bảo vệ an toàn thông tin, không làm lộ stacktrace.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneralException(Exception ex) {
        log.error("Unhandled internal server error: ", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error("Hệ thống Orbit đang tạm thời xử lý, bạn vui lòng thử lại sau giây lát nhé."));
    }
}
