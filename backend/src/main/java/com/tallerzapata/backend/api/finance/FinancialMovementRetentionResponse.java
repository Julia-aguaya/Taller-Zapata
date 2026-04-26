package com.tallerzapata.backend.api.finance;

import java.math.BigDecimal;

public record FinancialMovementRetentionResponse(
        Long id,
        String retentionTypeCode,
        BigDecimal amount,
        String detail
) {
}
