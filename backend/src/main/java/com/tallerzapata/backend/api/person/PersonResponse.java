package com.tallerzapata.backend.api.person;

import java.time.LocalDate;

public record PersonResponse(
        Long id,
        String publicId,
        String tipoPersona,
        String nombre,
        String apellido,
        String razonSocial,
        String nombreMostrar,
        String tipoDocumentoCodigo,
        String numeroDocumento,
        String numeroDocumentoNormalizado,
        String cuitCuil,
        LocalDate fechaNacimiento,
        String telefonoPrincipal,
        String emailPrincipal,
        String ocupacion,
        String observaciones,
        Boolean activo
) {
}
