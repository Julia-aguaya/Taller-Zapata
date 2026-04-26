package com.tallerzapata.backend.api.person;

public record PersonAddressResponse(
        Long id,
        Long personId,
        String tipoDomicilioCodigo,
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
