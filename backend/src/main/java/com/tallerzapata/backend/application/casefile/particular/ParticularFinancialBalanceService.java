package com.tallerzapata.backend.application.casefile.particular;

import java.math.BigDecimal;

public interface ParticularFinancialBalanceService {
    BigDecimal balanceFor(Long caseId);
}
