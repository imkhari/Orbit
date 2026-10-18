package com.orbit.exception;

/**
 * Ngoại lệ được kích hoạt khi người dùng cố tình chuyển thêm nhiệm vụ thứ 2 vào cột DOING.
 * Tuân thủ nghiêm ngặt nguyên tắc công thái học nhận thức ADHD:
 * Câu chữ giải thích mang tính đồng cảm, bảo vệ sự tập trung, tuyệt đối không dùng từ ngữ phán xét.
 */
public class WipLimitExceededException extends RuntimeException {

    private static final String DEFAULT_MESSAGE =
        "🎯 Đơn nhiệm là siêu năng lực của bạn! Bạn đang có 1 nhiệm vụ trong cột 'Đang làm' (Doing). " +
        "Hãy hoàn thành dứt điểm hoặc chuyển việc hiện tại về 'Cần làm' (Todo) trước khi nhận thêm việc mới nhé!";

    public WipLimitExceededException() {
        super(DEFAULT_MESSAGE);
    }

    public WipLimitExceededException(String message) {
        super(message);
    }
}
