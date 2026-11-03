package com.tallerzapata.backend.api.budget;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BudgetActionCreateRequest(
        @NotBlank(message = "El nombre del tipo de acción es obligatorio")
        @Size(max = 120, message = "El nombre del tipo de acción no puede superar los 120 caracteres")
        String name
) {
}
