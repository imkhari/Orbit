package com.orbit.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO nhận dữ liệu tạo mới bảng Kanban.
 */
public record CreateBoardRequest(
    @NotBlank(message = "Tên bảng không được để trống")
    @Size(min = 2, max = 50, message = "Tên bảng phải từ 2 đến 50 ký tự")
    String title,

    String icon,

    String colorTheme
) {
    public String iconOrDefault() {
        return (icon != null && !icon.isBlank()) ? icon.trim() : "📋";
    }

    public String colorThemeOrDefault() {
        return (colorTheme != null && !colorTheme.isBlank()) ? colorTheme.trim() : "sky";
    }
}
