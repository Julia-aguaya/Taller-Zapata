package com.tallerzapata.backend.api.vehicle;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record VehiclePersonUpsertRequest(
        @NotNull Long personId,
        @NotBlank String rolVehiculoCodigo,
        Boolean esActual,
        LocalDate desde,
        LocalDate hasta,
        String notas
) {
}
