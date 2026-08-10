package com.tallerzapata.backend.api.organization;
import jakarta.validation.constraints.NotBlank;
public record ReferenciadorRequest(@NotBlank String nombre, String apellido, String telefono) {}
