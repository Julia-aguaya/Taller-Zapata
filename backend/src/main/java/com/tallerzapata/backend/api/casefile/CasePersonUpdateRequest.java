package com.tallerzapata.backend.api.casefile;

import jakarta.validation.constraints.NotNull;

public record CasePersonUpdateRequest(
        @NotNull String caseRoleCode,
        Long vehicleId,
        String notes,
        Integer porcentajeTitularidad
) { }
