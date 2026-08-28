package com.tallerzapata.backend.api.casefile;

import jakarta.validation.constraints.NotBlank;

public record NewReferenciadorRequest(
        @NotBlank String nombre,
        String apellido,
        String telefono
) {
}
