package com.tallerzapata.backend.api.vehicle;

public record VehicleModelResponse(
        Long id,
        Long brandId,
        String codigo,
        String nombre,
        Boolean activo
) {
}
