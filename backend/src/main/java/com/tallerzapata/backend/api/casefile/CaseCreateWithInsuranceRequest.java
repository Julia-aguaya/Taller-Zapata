package com.tallerzapata.backend.api.casefile;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record CaseCreateWithInsuranceRequest(
        @NotNull @Valid CaseCreateRequest caseRequest,
        @NotNull @Valid CaseInsuranceCreateRequest insurance
) {
}
