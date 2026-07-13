package com.tallerzapata.backend.api.casefile;

import java.util.List;

public record CaseReadinessTabResponse(
        String tabCode,
        Boolean allowed,
        Boolean completed,
        String colorHint,
        List<String> blockingReasons,
        List<String> warningReasons
) {
}
