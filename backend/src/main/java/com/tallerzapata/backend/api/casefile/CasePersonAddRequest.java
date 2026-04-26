package com.tallerzapata.backend.api.casefile;

import jakarta.validation.constraints.NotNull;

public record CasePersonAddRequest(
        @NotNull Long personId,
        @NotNull String caseRoleCode,
        Long vehicleId,
        Boolean isMain,
        String notes
) {
}
