package com.tallerzapata.backend.application.security;

import com.tallerzapata.backend.application.common.UnauthorizedException;
import com.tallerzapata.backend.infrastructure.observability.AuthMetricsService;
import com.tallerzapata.backend.infrastructure.persistence.security.RefreshTokenEntity;
import com.tallerzapata.backend.infrastructure.persistence.security.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthMetricsService authMetricsService;
    private final long refreshTokenDays;

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            AuthMetricsService authMetricsService,
            @Value("${app.security.refresh-token-days}") long refreshTokenDays
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.authMetricsService = authMetricsService;
        this.refreshTokenDays = refreshTokenDays;
    }

    @Transactional
    public String issue(Long userId) {
        String rawToken = generateRawToken();
        RefreshTokenEntity entity = new RefreshTokenEntity();
        entity.setUserId(userId);
        entity.setTokenHash(hash(rawToken));
        entity.setExpiresAt(LocalDateTime.now().plusDays(refreshTokenDays));
        refreshTokenRepository.save(entity);
        return rawToken;
    }

    @Transactional
    public RotationResult rotate(String rawToken) {
        String currentHash = hash(rawToken);
        RefreshTokenEntity current = refreshTokenRepository.findByTokenHash(currentHash)
                .orElseThrow(() -> {
                    authMetricsService.refreshFailure("invalid");
                    return new UnauthorizedException("Refresh token invalido");
                });

        if (current.getRevokedAt() != null) {
            if (current.getReplacedByTokenHash() != null) {
                authMetricsService.refreshFailure("reused");
                throw new UnauthorizedException("Refresh token reutilizado");
            }
            authMetricsService.refreshFailure("revoked");
            throw new UnauthorizedException("Refresh token revocado");
        }
        if (current.getExpiresAt().isBefore(LocalDateTime.now())) {
            authMetricsService.refreshFailure("expired");
            throw new UnauthorizedException("Refresh token expirado");
        }

        String replacementRaw = generateRawToken();
        String replacementHash = hash(replacementRaw);

        current.setRevokedAt(LocalDateTime.now());
        current.setReplacedByTokenHash(replacementHash);
        refreshTokenRepository.save(current);

        RefreshTokenEntity replacement = new RefreshTokenEntity();
        replacement.setUserId(current.getUserId());
        replacement.setTokenHash(replacementHash);
        replacement.setExpiresAt(LocalDateTime.now().plusDays(refreshTokenDays));
        refreshTokenRepository.save(replacement);

        return new RotationResult(replacement.getUserId(), replacementRaw);
    }

    @Transactional
    public void revokeAllByUserId(Long userId) {
        refreshTokenRepository.revokeAllActiveByUserId(userId, LocalDateTime.now());
    }

    @Transactional
    public void revokeTokenForUser(Long userId, String rawToken) {
        String tokenHash = hash(rawToken);
        RefreshTokenEntity token = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new UnauthorizedException("Refresh token invalido"));

        if (!token.getUserId().equals(userId)) {
            throw new UnauthorizedException("Refresh token invalido");
        }

        if (token.getRevokedAt() == null) {
            token.setRevokedAt(LocalDateTime.now());
            refreshTokenRepository.save(token);
        }
    }

    private String generateRawToken() {
        String source = UUID.randomUUID() + ":" + UUID.randomUUID();
        return Base64.getUrlEncoder().withoutPadding().encodeToString(source.getBytes(StandardCharsets.UTF_8));
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder();
            for (byte hashByte : hashBytes) {
                builder.append(String.format("%02x", hashByte));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("No se pudo calcular hash SHA-256", exception);
        }
    }

    public record RotationResult(Long userId, String refreshToken) {
    }
}
