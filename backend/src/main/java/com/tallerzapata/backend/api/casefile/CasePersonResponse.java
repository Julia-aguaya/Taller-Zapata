package com.tallerzapata.backend.api.casefile;

public record CasePersonResponse(
        Long id,
        Long personId,
        String displayName,
        String caseRoleCode,
        Long vehicleId,
        Boolean principal,
        Integer registryOwnershipPercentage,
        String notes
) {
}
