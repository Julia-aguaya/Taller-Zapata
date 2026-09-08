package com.tallerzapata.backend.api.casefile;

import jakarta.validation.constraints.NotNull;

public record CasePersonAddRequest(
        @NotNull Long personId,
        @NotNull String caseRoleCode,
        Long vehicleId,
        Boolean isMain,
        String notes,
        Integer porcentajeTitularidad
) {

    /** Constructor de compatibilidad: los llamadores que no manejan titularidad siguen compilando. */
    public CasePersonAddRequest(Long personId, String caseRoleCode, Long vehicleId, Boolean isMain, String notes) {
        this(personId, caseRoleCode, vehicleId, isMain, notes, null);
    }
}
