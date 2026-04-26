package com.tallerzapata.backend.api.auth;

public record LogoutRequest(
        String refreshToken,
        Boolean revokeAllSessions
) {
}
