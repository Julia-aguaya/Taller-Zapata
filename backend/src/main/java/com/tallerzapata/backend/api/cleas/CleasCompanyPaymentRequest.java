package com.tallerzapata.backend.api.cleas;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import com.tallerzapata.backend.api.finance.FinancialMovementRetentionRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;

public record CleasCompanyPaymentRequest(
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        LocalDateTime movementAt,
        String paymentMethodCode,
        String paymentMethodDetail,
        Long receiptId,
        String externalReference,
        String reason,
        @NotNull Long documentId,
        List<@Valid FinancialMovementRetentionRequest> retentions
) {
}
