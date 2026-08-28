package com.tallerzapata.backend.api.cleas;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CleasCustomerFranchisePaymentRequest(
        BigDecimal amount,
        LocalDateTime movementAt,
        String paymentMethodCode,
        String paymentMethodDetail,
        Long receiptId,
        String externalReference,
        String reason
) {
}
