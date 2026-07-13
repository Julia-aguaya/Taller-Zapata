package com.tallerzapata.backend.api.auth;

import java.util.List;

public record AuthSessionResponse(
        AuthSessionUserResponse user,
        List<String> authorities,
        List<AuthSessionScopeResponse> scopes,
        AuthSessionNavigationResponse navigation,
        AuthSessionCapabilitiesResponse capabilities,
        Long unreadNotifications
) {
}
