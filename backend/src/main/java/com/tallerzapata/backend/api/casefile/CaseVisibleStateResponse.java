package com.tallerzapata.backend.api.casefile;

public record CaseVisibleStateResponse(
        String domain,
        String code,
        String label,
        String source,
        Boolean manualOverride
) {
}
