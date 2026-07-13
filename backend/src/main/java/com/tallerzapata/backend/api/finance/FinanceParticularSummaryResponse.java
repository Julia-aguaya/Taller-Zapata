package com.tallerzapata.backend.api.finance;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record FinanceParticularSummaryResponse(
        Long caseId,
        BigDecimal quotedTotal,
        BigDecimal customerPaid,
        BigDecimal pendingBalance,
        Boolean hasAdvancePayment,
        Boolean paidInFull,
        LocalDateTime paidInFullAt
) {
}
