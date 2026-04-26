package com.tallerzapata.backend.api.finance;

import java.math.BigDecimal;

public record FinanceCaseSummaryResponse(
        Long caseId,
        BigDecimal totalIngresos,
        BigDecimal totalEgresos,
        BigDecimal saldo,
        BigDecimal totalRetenciones,
        BigDecimal totalAplicado
) {
}
