package com.tallerzapata.backend.infrastructure.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtTokenService {

    private final SecretKey secretKey;
    private final long accessTokenSeconds;

    public JwtTokenService(
            @Value("${app.security.jwt-secret}") String jwtSecret,
            @Value("${app.security.access-token-seconds}") long accessTokenSeconds
    ) {
        this.secretKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenSeconds = accessTokenSeconds;
    }

    public String generateAccessToken(AuthenticatedUser user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(accessTokenSeconds);
        return Jwts.builder()
                .subject(user.id().toString())
                .claim("username", user.username())
                .claim("displayName", user.displayName())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(secretKey)
                .compact();
    }

    public Long extractUserId(String token) {
        Claims claims = Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload();
        return Long.valueOf(claims.getSubject());
    }
}
