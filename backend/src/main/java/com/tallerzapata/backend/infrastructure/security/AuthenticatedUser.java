package com.tallerzapata.backend.infrastructure.security;

import java.util.Set;

public record AuthenticatedUser(
        Long id,
        String username,
        String displayName,
        String role,
        Set<String> authorities
) {
}
