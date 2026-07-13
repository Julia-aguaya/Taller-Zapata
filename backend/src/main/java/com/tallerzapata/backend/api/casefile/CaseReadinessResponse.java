package com.tallerzapata.backend.api.casefile;

import java.util.List;

public record CaseReadinessResponse(
        Long caseId,
        String caseTypeCode,
        List<CaseReadinessTabResponse> tabs
) {
}
