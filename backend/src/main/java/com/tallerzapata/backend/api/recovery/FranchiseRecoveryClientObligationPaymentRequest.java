package com.tallerzapata.backend.api.recovery;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record FranchiseRecoveryClientObligationPaymentRequest(
        BigDecimal amount,
        LocalDateTime movementAt,
        String paymentMethodCode,
        String paymentMethodDetail,
        String externalReference,
        String reason
) {
}
