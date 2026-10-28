package com.tallerzapata.backend.api.vehicle;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VehicleTypeCategoryCreateRequest(
        @NotBlank(message = "El nombre de la categoría es obligatorio")
        @Size(max = 120, message = "El nombre de la categoría no puede superar los 120 caracteres")
        String name
) {
}
