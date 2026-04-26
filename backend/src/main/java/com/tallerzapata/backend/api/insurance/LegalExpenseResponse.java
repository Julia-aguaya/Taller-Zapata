package com.tallerzapata.backend.api.insurance;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LegalExpenseResponse(
        Long id,
        Long caseLegalId,
        String concept,
        BigDecimal amount,
        LocalDate expenseDate,
        String paidByCode,
        Long financialMovementId
) {
}
