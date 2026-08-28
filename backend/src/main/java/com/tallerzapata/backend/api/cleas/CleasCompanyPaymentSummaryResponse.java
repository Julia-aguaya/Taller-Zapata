package com.tallerzapata.backend.api.cleas;

import java.math.BigDecimal;

public record CleasCompanyPaymentSummaryResponse(
        Long caseId,
        Long companyId,
        BigDecimal agreedAmount,
        BigDecimal paidAmount,
        BigDecimal pendingAmount
) {
}
