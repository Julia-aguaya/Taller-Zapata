package com.tallerzapata.backend.api.finance;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record FinancialMovementCreateRequest(
        Long receiptId,
        @NotBlank String movementTypeCode,
        @NotBlank String flowOriginCode,
        @NotBlank String counterpartyTypeCode,
        Long counterpartyPersonId,
        Long counterpartyCompanyId,
        @NotNull LocalDateTime movementAt,
        @NotNull @DecimalMin("0.00") BigDecimal grossAmount,
        @NotNull @DecimalMin("0.00") BigDecimal netAmount,
        @NotBlank String paymentMethodCode,
        String paymentMethodDetail,
        String cancellationTypeCode,
        Boolean advancePayment,
        Boolean bonification,
        String reason,
        String externalReference,
        @Valid List<FinancialMovementRetentionRequest> retentions,
        @Valid List<FinancialMovementApplicationRequest> applications
) {
}
