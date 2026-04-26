package com.tallerzapata.backend.api.casefile;

public record CaseRelationResponse(
        Long id,
        Long sourceCaseId,
        Long targetCaseId,
        String relationTypeCode,
        String description
) {
}
