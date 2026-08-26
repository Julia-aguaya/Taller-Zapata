package com.tallerzapata.backend.api.casefile;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record CaseCreateWithReferenciadorRequest(
        @NotNull @Valid CaseCreateRequest caseRequest,
        @NotNull @Valid NewReferenciadorRequest referenciador
) {
}
