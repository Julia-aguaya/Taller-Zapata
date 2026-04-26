package com.tallerzapata.backend.api.finance;

import java.math.BigDecimal;

public record FinancialMovementApplicationResponse(
        Long id,
        String conceptCode,
        String entityType,
        Long entityId,
        BigDecimal appliedAmount
) {
}
