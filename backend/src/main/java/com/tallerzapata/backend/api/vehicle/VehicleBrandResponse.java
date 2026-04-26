package com.tallerzapata.backend.api.vehicle;

public record VehicleBrandResponse(
        Long id,
        String codigo,
        String nombre,
        Boolean activo
) {
}
