package com.tallerzapata.backend.api.cleas;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CleasCompanyPaymentResponse(
        Long movementId,
        String publicId,
        BigDecimal amount,
        LocalDateTime movementAt,
        String paymentMethodCode,
        String paymentMethodDetail,
        Long receiptId,
        String externalReference,
        String reason
) {
}
