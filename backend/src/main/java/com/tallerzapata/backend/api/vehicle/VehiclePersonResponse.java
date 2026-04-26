package com.tallerzapata.backend.api.vehicle;

import java.time.LocalDate;

public record VehiclePersonResponse(
        Long id,
        Long vehicleId,
        Long personId,
        String rolVehiculoCodigo,
        Boolean esActual,
        LocalDate desde,
        LocalDate hasta,
        String notas
) {
}
