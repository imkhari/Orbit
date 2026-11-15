package com.orbit.dto.request;

import jakarta.validation.constraints.Size;

/**
 * DTO nhận dữ liệu cập nhật bảng Kanban.
 */
public record UpdateBoardRequest(
    @Size(min = 2, max = 50, message = "Tên bảng phải từ 2 đến 50 ký tự")
    String title,

    String icon,

    String colorTheme,

    Integer position,

    Boolean isArchived
) {
}
