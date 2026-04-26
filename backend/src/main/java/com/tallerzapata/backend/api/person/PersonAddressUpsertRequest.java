package com.tallerzapata.backend.api.person;

import jakarta.validation.constraints.NotBlank;

public record PersonAddressUpsertRequest(
        @NotBlank String tipoDomicilioCodigo,
        String calle,
        String numero,
        String piso,
        String depto,
        String localidad,
        String provincia,
        String codigoPostal,
        String paisCodigo,
        Boolean principal
) {
}
