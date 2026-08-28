package com.tallerzapata.backend.api.cleas;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import com.tallerzapata.backend.api.finance.FinancialMovementRetentionResponse;

public record CleasCompanyPaymentResponse(
        Long movementId,
        String publicId,
        BigDecimal amount,
        LocalDateTime movementAt,
        String paymentMethodCode,
        String paymentMethodDetail,
        Long receiptId,
        String externalReference,
        String reason,
        BigDecimal grossAmount,
        BigDecimal retentionsAmount,
        BigDecimal netAmount,
        Long documentId,
        List<FinancialMovementRetentionResponse> retentions
) {
}
