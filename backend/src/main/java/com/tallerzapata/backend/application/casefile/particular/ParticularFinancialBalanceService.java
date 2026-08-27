package com.tallerzapata.backend.application.casefile.particular;

import java.math.BigDecimal;

public interface ParticularFinancialBalanceService {
    BigDecimal balanceFor(Long caseId);

    /**
     * Monto total citado al cliente (presupuesto). Null cuando todavía no existe
     * presupuesto: sin monto esperado no puede declararse una carpeta como pagada.
     */
    BigDecimal expectedQuotedTotal(Long caseId);
}
