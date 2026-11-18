package com.orbit.security;

import com.orbit.entity.User;
import com.orbit.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    private static final Set<String> LOOPBACK = Set.of("127.0.0.1", "::1", "0:0:0:0:0:0:0:1");
    private static final Set<String> PUBLIC_PATHS = Set.of(
            "/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/refresh", "/api/v1/health");

    @Value("${orbit.demo.anonymous:false}")
    private boolean anonymousDemo;

    @Value("${server.address:}")
    private String bindAddress;

    @PostConstruct
    void checkDemoBinding() {
        if (anonymousDemo && !LOOPBACK.contains(bindAddress)) {
            throw new IllegalStateException("Orbit local demo requires a loopback server.address.");
        }
    }

    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String jwt = extractJwtFromRequest(request);
        Optional<User> account = StringUtils.hasText(jwt)
                ? tokenProvider.accessSubject(jwt).flatMap(userRepository::findById)
                : Optional.empty();

        if (account.isEmpty() && isLocalDemoRequest(request)) {
            account = Optional.of(localDemoUser());
        }

        account.ifPresent(user -> {
            var authentication = new UsernamePasswordAuthenticationToken(
                    user, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        });

        filterChain.doFilter(request, response);
    }

    private boolean isLocalDemoRequest(HttpServletRequest request) {
        return anonymousDemo
                && LOOPBACK.contains(request.getRemoteAddr())
                && request.getRequestURI().startsWith("/api/v1/")
                && !PUBLIC_PATHS.contains(request.getRequestURI())
                && request.getHeader("Authorization") == null
                && request.getHeader("Origin") == null
                && request.getHeader("Forwarded") == null
                && request.getHeader("X-Forwarded-For") == null;
    }

    private synchronized User localDemoUser() {
        return userRepository.findByEmail("demo@orbit.app").orElseGet(() -> userRepository.save(
                User.builder()
                        .email("demo@orbit.app")
                        .displayName("Khách Orbit")
                        .passwordHash("LOCAL_DEMO_ACCOUNT")
                        .currentEnergyLevel(User.EnergyLevel.MEDIUM)
                        .build()));
    }

    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
