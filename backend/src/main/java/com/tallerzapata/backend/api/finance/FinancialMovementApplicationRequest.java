package com.tallerzapata.backend.api.finance;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record FinancialMovementApplicationRequest(
        @NotBlank String conceptCode,
        @NotBlank String entityType,
        @NotNull Long entityId,
        @NotNull @DecimalMin("0.00") BigDecimal appliedAmount
) {
}
