package com.tallerzapata.backend.api.auth;

public record AuthSessionUserResponse(
        String id,
        String username,
        String displayName,
        String role
) {
}
