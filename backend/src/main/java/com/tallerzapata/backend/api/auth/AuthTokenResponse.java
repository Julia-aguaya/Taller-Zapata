package com.tallerzapata.backend.api.auth;

public record AuthTokenResponse(
        String accessToken,
        String refreshToken,
        long expiresInSeconds,
        AuthenticatedUserResponse user
) {
}
