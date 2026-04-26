package com.tallerzapata.backend.api.finance;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record FinancialMovementRetentionRequest(
        @NotBlank String retentionTypeCode,
        @NotNull @DecimalMin("0.00") BigDecimal amount,
        String detail
) {
}
