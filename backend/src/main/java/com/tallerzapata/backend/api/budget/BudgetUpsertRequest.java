package com.tallerzapata.backend.api.budget;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BudgetUpsertRequest(
        LocalDate budgetDate,
        String reportStatusCode,
        BigDecimal laborWithoutVat,
        BigDecimal vatRate,
        BigDecimal partsTotal,
        Integer estimatedDays,
        BigDecimal minimumCloseAmount,
        String observations
) {
}
