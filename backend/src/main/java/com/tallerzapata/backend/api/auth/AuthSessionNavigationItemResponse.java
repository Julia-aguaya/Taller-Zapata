package com.tallerzapata.backend.api.auth;

public record AuthSessionNavigationItemResponse(
        String code,
        String label,
        String path,
        Boolean enabled
) {
}
