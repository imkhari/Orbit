package com.orbit.exception;

/**
 * Ngoại lệ khi không tìm thấy tài nguyên được yêu cầu.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resourceName, Object identifier) {
        super(String.format("Không tìm thấy %s với định danh: %s", resourceName, identifier));
    }
}
