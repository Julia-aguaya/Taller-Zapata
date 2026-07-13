package com.tallerzapata.backend.api.auth;

public record AuthSessionCapabilitiesResponse(
        Boolean canCreateCase,
        Boolean canAccessPanel,
        Boolean canAccessManagement,
        Boolean canOverrideVisibleStates,
        Boolean canForceWorkflowTransition
) {
}
