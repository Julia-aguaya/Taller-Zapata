package com.tallerzapata.backend.api.recovery;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record FranchiseRecoveryClientObligationResponse(
        Long id,
        String typeCode,
        String directionCode,
        BigDecimal originalAmount,
        BigDecimal outstandingAmount,
        String statusCode,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime inactivatedAt,
        String inactivationReason,
        List<FranchiseRecoveryClientObligationPaymentApplicationResponse> applications
) {
}
