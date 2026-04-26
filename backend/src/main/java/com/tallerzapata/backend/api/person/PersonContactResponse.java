package com.tallerzapata.backend.api.person;

public record PersonContactResponse(
        Long id,
        Long personId,
        String tipoContactoCodigo,
        String valor,
        Boolean principal,
        Boolean validado,
        String observaciones
) {
}
