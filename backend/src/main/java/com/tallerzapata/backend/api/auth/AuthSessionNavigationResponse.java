package com.tallerzapata.backend.api.auth;

import java.util.List;

public record AuthSessionNavigationResponse(
        String defaultRoute,
        List<AuthSessionNavigationItemResponse> items
) {
}
