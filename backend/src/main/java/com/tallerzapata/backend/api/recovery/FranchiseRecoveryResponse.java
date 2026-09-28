package com.tallerzapata.backend.api.recovery;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record FranchiseRecoveryResponse(
        Long id,
        Long caseId,
        String managerCode,
        Long baseCaseId,
        String baseFolderCode,
        String opinionCode,
        BigDecimal agreedAmount,
        BigDecimal recoveryAmount,
        Boolean enablesRepair,
        Boolean recoversClient,
        BigDecimal clientAmount,
        String clientPaymentStatusCode,
        LocalDate clientPaymentDate,
        Boolean approvedLowerAgreement,
        String approvalNote,
        Long approvedByUserId,
        LocalDateTime approvedAt,
        Boolean reusesBaseData
) {
}
