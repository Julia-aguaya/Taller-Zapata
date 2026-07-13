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
        String observations,
        String authorizedByName,
        String interestedName,
        Boolean benchStraighteningApplies,
        String benchStraighteningDetail,
        Boolean alignmentApplies,
        String alignmentDetail,
        Boolean balancingApplies,
        String balancingDetail,
        Boolean glassReplacementApplies,
        String glassReplacementDetail,
        Boolean electricalWorkApplies,
        String electricalDetail,
        Boolean mechanicalWorkApplies,
        String mechanicalWorkCode,
        LocalDate quotedPartsDate,
        String quotedPartsSupplier
) {
}
