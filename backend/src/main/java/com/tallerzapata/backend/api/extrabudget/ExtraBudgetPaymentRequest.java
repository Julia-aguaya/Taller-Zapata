package com.tallerzapata.backend.api.extrabudget;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ExtraBudgetPaymentRequest(
        Long expectedVersion,
        BigDecimal amount,
        LocalDateTime movementAt,
        String paymentMethodCode,
        String paymentMethodDetail,
        Long receiptId,
        String externalReference,
        String reason
) {
}
