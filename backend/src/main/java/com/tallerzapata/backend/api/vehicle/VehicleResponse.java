package com.tallerzapata.backend.api.vehicle;

public record VehicleResponse(
        Long id,
        String publicId,
        Long brandId,
        Long modelId,
        String brandText,
        String modelText,
        String plate,
        String normalizedPlate,
        Short year,
        String vehicleTypeCode,
        String usageCode,
        String color,
        String paintCode,
        String chasis,
        String motor,
        String transmissionCode,
        Integer mileage,
        String observaciones,
        Boolean activo
) {
}
