package com.tallerzapata.backend.api.cleas;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CleasFranchisePaymentSummaryResponse(
        Long caseId,
        BigDecimal franchiseAmount,
        BigDecimal companyRequiredAmount,
        BigDecimal customerChargeAmount,
        BigDecimal amountToBillCompany,
        BigDecimal customerPaidAmount,
        BigDecimal customerPendingAmount,
        String companyPaymentStatusCode,
        LocalDate companyPaymentDate
) {
}
