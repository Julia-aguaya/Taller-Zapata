package com.tallerzapata.backend.api.insurance;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CaseCleasUpsertRequest(
        String scopeCode,
        String opinionCode,
        BigDecimal franchiseAmount,
        BigDecimal customerChargeAmount,
        String customerPaymentStatusCode,
        LocalDate customerPaymentDate,
        BigDecimal companyFranchisePaymentAmount,
        String companyFranchisePaymentStatusCode,
        LocalDate companyFranchisePaymentDate
) {
}
