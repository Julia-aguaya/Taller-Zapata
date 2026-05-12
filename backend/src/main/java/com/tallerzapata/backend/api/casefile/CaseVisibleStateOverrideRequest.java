package com.tallerzapata.backend.api.casefile;

public record CaseVisibleStateOverrideRequest(
        String domain,
        String stateCode,
        String reason
) {
}
