package com.tallerzapata.backend.api.casefile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CaseRelationCreateRequest(
        @NotNull Long targetCaseId,
        @NotBlank String relationTypeCode,
        String description
) {
}
