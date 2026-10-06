package com.tallerzapata.backend.api.recovery;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record FranchiseRecoveryClientObligationPaymentApplicationResponse(
        Long id,
        Long movementId,
        BigDecimal appliedAmount,
        String statusCode,
        Long reversedApplicationId,
        String idempotencyKey,
        LocalDateTime createdAt,
        LocalDateTime annulledAt
) {
}
