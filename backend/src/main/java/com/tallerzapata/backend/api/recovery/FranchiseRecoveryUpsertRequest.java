package com.tallerzapata.backend.api.recovery;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FranchiseRecoveryUpsertRequest(
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
        Boolean reusesBaseData
) {
}
