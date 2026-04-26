package com.tallerzapata.backend.api.budget;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record BudgetResponse(
        Long id,
        Long caseId,
        Long organizationId,
        Long branchId,
        LocalDate budgetDate,
        String reportStatusCode,
        BigDecimal laborWithoutVat,
        BigDecimal vatRate,
        BigDecimal laborVat,
        BigDecimal laborWithVat,
        BigDecimal partsTotal,
        BigDecimal totalQuoted,
        Integer estimatedDays,
        BigDecimal minimumCloseAmount,
        String observations,
        Integer currentVersion,
        List<BudgetItemResponse> items
) {
}
