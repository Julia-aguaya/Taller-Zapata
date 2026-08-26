package com.tallerzapata.backend.api.casefile;

public record NewInsuranceContactRequest(
        String nombre,
        String apellido,
        String email,
        String telefono
) {
}
