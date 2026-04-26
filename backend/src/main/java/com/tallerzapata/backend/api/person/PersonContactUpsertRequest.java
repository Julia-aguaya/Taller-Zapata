package com.tallerzapata.backend.api.person;

import jakarta.validation.constraints.NotBlank;

public record PersonContactUpsertRequest(
        @NotBlank String tipoContactoCodigo,
        @NotBlank String valor,
        Boolean principal,
        Boolean validado,
        String observaciones
) {
}
