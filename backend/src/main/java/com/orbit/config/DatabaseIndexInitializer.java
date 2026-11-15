package com.orbit.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Khởi tạo Partial Unique Index trên PostgreSQL để bảo vệ ràng buộc đơn nhiệm (WIP Limit = 1 ở cột DOING).
 * Đảm bảo cấp độ Database ngăn chặn hoàn toàn Race Condition (TOCTOU).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseIndexInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute(
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_user_single_active_doing " +
                "ON tasks (user_id) " +
                "WHERE status = 'DOING'"
            );
            log.info("PostgreSQL partial unique index 'idx_user_single_active_doing' verified.");
        } catch (Exception ex) {
            // Không ngắt ứng dụng khi chạy trên các hệ CSDL kiểm thử in-memory không hỗ trợ partial index
            log.info("Database index initializer note (partial unique index on DOING): {}", ex.getMessage());
        }
    }
}
