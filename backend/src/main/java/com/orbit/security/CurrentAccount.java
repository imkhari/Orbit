package com.orbit.security;

import com.orbit.entity.User;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.context.SecurityContextHolder;

public final class CurrentAccount {

    private CurrentAccount() {
    }

    public static User require() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof User user) {
            return user;
        }
        throw new AuthenticationCredentialsNotFoundException("Hãy đăng nhập để tiếp tục.");
    }
}
