package com.tallerzapata.backend.api.casefile;

import jakarta.validation.constraints.NotNull;

public record CaseVehicleAddRequest(
        @NotNull Long vehicleId,
        @NotNull String vehicleRoleCode,
        Boolean isMain,
        String notes
) {
}
