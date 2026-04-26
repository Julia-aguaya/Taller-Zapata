package com.tallerzapata.backend.api.person;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

public record PersonUpsertRequest(
        @NotBlank @Pattern(regexp = "fisica|juridica") String tipoPersona,
        String nombre,
        String apellido,
        String razonSocial,
        String tipoDocumentoCodigo,
        String numeroDocumento,
        String cuitCuil,
        LocalDate fechaNacimiento,
        String telefonoPrincipal,
        String emailPrincipal,
        String ocupacion,
        String observaciones,
        Boolean activo
) {
}
