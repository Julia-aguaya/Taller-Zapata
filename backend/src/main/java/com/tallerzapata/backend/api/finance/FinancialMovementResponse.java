package com.tallerzapata.backend.api.finance;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record FinancialMovementResponse(
        Long id,
        String publicId,
        Long caseId,
        Long receiptId,
        String movementTypeCode,
        String flowOriginCode,
        String counterpartyTypeCode,
        Long counterpartyPersonId,
        Long counterpartyCompanyId,
        LocalDateTime movementAt,
        BigDecimal grossAmount,
        BigDecimal netAmount,
        String paymentMethodCode,
        String paymentMethodDetail,
        String cancellationTypeCode,
        Boolean advancePayment,
        Boolean bonification,
        String reason,
        String externalReference,
        Long registeredBy,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<FinancialMovementRetentionResponse> retentions,
        List<FinancialMovementApplicationResponse> applications
) {
}
