package com.tallerzapata.backend.application.security;

import com.tallerzapata.backend.api.auth.AuthTokenResponse;
import com.tallerzapata.backend.api.auth.AuthenticatedUserResponse;
import com.tallerzapata.backend.application.common.UnauthorizedException;
import com.tallerzapata.backend.infrastructure.persistence.security.UserEntity;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.JwtTokenService;
import com.tallerzapata.backend.infrastructure.security.UserSecurityService;
import com.tallerzapata.backend.infrastructure.observability.AuthMetricsService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthApplicationService {

    private final UserSecurityService userSecurityService;
    private final RefreshTokenService refreshTokenService;
    private final JwtTokenService jwtTokenService;
    private final PasswordEncoder passwordEncoder;
    private final AuthMetricsService authMetricsService;
    private final long accessTokenSeconds;

    public AuthApplicationService(
            UserSecurityService userSecurityService,
            RefreshTokenService refreshTokenService,
            JwtTokenService jwtTokenService,
            PasswordEncoder passwordEncoder,
            AuthMetricsService authMetricsService,
            @Value("${app.security.access-token-seconds}") long accessTokenSeconds
    ) {
        this.userSecurityService = userSecurityService;
        this.refreshTokenService = refreshTokenService;
        this.jwtTokenService = jwtTokenService;
        this.passwordEncoder = passwordEncoder;
        this.authMetricsService = authMetricsService;
        this.accessTokenSeconds = accessTokenSeconds;
    }

    @Transactional
    public AuthTokenResponse login(String email, String rawPassword) {
        UserEntity user = userSecurityService.findActiveByEmail(email)
                .orElseThrow(() -> {
                    authMetricsService.loginFailure("invalid_credentials");
                    return new UnauthorizedException("Credenciales invalidas");
                });

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            authMetricsService.loginFailure("invalid_credentials");
            throw new UnauthorizedException("Credenciales invalidas");
        }

        AuthenticatedUser authenticatedUser = userSecurityService.buildAuthenticatedUser(user);
        String accessToken = jwtTokenService.generateAccessToken(authenticatedUser);
        String refreshToken = refreshTokenService.issue(user.getId());
        authMetricsService.loginSuccess();

        return new AuthTokenResponse(accessToken, refreshToken, accessTokenSeconds, toResponse(authenticatedUser));
    }

    @Transactional
    public AuthTokenResponse refresh(String refreshToken) {
        RefreshTokenService.RotationResult result = refreshTokenService.rotate(refreshToken);
        AuthenticatedUser authenticatedUser = userSecurityService.requireAuthenticatedUser(result.userId());
        String accessToken = jwtTokenService.generateAccessToken(authenticatedUser);
        authMetricsService.refreshSuccess();

        return new AuthTokenResponse(accessToken, result.refreshToken(), accessTokenSeconds, toResponse(authenticatedUser));
    }

    @Transactional
    public void logout(Long userId, String refreshToken, boolean revokeAllSessions) {
        if (revokeAllSessions || refreshToken == null || refreshToken.isBlank()) {
            refreshTokenService.revokeAllByUserId(userId);
            authMetricsService.logoutSuccess("all_sessions");
            return;
        }

        refreshTokenService.revokeTokenForUser(userId, refreshToken);
        authMetricsService.logoutSuccess("single_session");
    }

    private AuthenticatedUserResponse toResponse(AuthenticatedUser user) {
        return new AuthenticatedUserResponse(
                user.id().toString(),
                user.displayName(),
                user.authorities().stream().sorted().findFirst().orElse("ROLE_USER")
        );
    }
}
