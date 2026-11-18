package com.orbit.security;

import com.orbit.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import java.util.Optional;

@Component
public class JwtTokenProvider {

    @Value("${orbit.jwt.secret:}")
    private String jwtSecret;

    @Value("${orbit.jwt.access-token-expiration-ms:900000}")
    private long accessTokenExpirationMs; // 15 minutes

    @Value("${orbit.jwt.refresh-token-expiration-ms:604800000}")
    private long refreshTokenExpirationMs; // 7 days

    private SecretKey key;

    @PostConstruct
    public void init() {
        if (jwtSecret.isBlank()) {
            key = Jwts.SIG.HS256.key().build();
        } else {
            key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        }
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(accessTokenExpirationMs);

        return Jwts.builder()
            .subject(user.getId().toString())
            .claim("type", "ACCESS")
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiry))
            .signWith(key)
            .compact();
    }

    public String generateRefreshToken(User user) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(refreshTokenExpirationMs);

        return Jwts.builder()
            .subject(user.getId().toString())
            .claim("type", "REFRESH")
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiry))
            .signWith(key)
            .compact();
    }

    public Optional<UUID> accessSubject(String token) {
        return subject(token, "ACCESS");
    }

    public Optional<UUID> refreshSubject(String token) {
        return subject(token, "REFRESH");
    }

    private Optional<UUID> subject(String token, String expectedType) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            String type = claims.get("type", String.class);
            if (!expectedType.equals(type)) return Optional.empty();
            return Optional.of(UUID.fromString(claims.getSubject()));
        } catch (JwtException | IllegalArgumentException | NullPointerException ex) {
            return Optional.empty();
        }
    }

    public long getAccessTokenExpirationSeconds() {
        return accessTokenExpirationMs / 1000;
    }
}
