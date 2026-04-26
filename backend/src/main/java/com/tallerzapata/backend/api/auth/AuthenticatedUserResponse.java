package com.tallerzapata.backend.api.auth;

public record AuthenticatedUserResponse(
        String id,
        String displayName,
        String role
) {
}
