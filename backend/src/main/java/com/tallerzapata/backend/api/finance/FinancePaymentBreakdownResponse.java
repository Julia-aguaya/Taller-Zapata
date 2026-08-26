package com.tallerzapata.backend.api.finance;

import java.math.BigDecimal;

public record FinancePaymentBreakdownResponse(
        Long caseId,
        Client client,
        Insurer insurer
) {
    public record Client(
            BigDecimal eligibleFranchise,
            BigDecimal franchisePaid,
            BigDecimal franchisePending,
            BigDecimal acceptedExtras,
            BigDecimal extrasPaid,
            BigDecimal extrasPending,
            BigDecimal total,
            BigDecimal paid,
            BigDecimal pending
    ) {
    }

    public record Insurer(
            Long companyId,
            BigDecimal agreement,
            BigDecimal eligibleFranchise,
            BigDecimal total,
            BigDecimal paid,
            BigDecimal pending
    ) {
    }
}
