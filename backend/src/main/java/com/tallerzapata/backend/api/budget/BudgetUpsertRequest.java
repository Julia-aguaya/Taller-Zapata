package com.tallerzapata.backend.api.budget;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

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
        String quotedPartsSupplier,
        Long providerId,
        List<BudgetItemCreateRequest> items
) {
    public BudgetUpsertRequest(LocalDate budgetDate, String reportStatusCode, BigDecimal laborWithoutVat, BigDecimal vatRate, BigDecimal partsTotal, Integer estimatedDays, BigDecimal minimumCloseAmount, String observations, String authorizedByName, String interestedName, Boolean benchStraighteningApplies, String benchStraighteningDetail, Boolean alignmentApplies, String alignmentDetail, Boolean balancingApplies, String balancingDetail, Boolean glassReplacementApplies, String glassReplacementDetail, Boolean electricalWorkApplies, String electricalDetail, Boolean mechanicalWorkApplies, String mechanicalWorkCode, LocalDate quotedPartsDate, String quotedPartsSupplier, Long providerId) {
        this(budgetDate, reportStatusCode, laborWithoutVat, vatRate, partsTotal, estimatedDays, minimumCloseAmount, observations, authorizedByName, interestedName, benchStraighteningApplies, benchStraighteningDetail, alignmentApplies, alignmentDetail, balancingApplies, balancingDetail, glassReplacementApplies, glassReplacementDetail, electricalWorkApplies, electricalDetail, mechanicalWorkApplies, mechanicalWorkCode, quotedPartsDate, quotedPartsSupplier, providerId, null);
    }

    public BudgetUpsertRequest(LocalDate budgetDate, String reportStatusCode, BigDecimal laborWithoutVat, BigDecimal vatRate, BigDecimal partsTotal, Integer estimatedDays, BigDecimal minimumCloseAmount, String observations, String authorizedByName, String interestedName, Boolean benchStraighteningApplies, String benchStraighteningDetail, Boolean alignmentApplies, String alignmentDetail, Boolean balancingApplies, String balancingDetail, Boolean glassReplacementApplies, String glassReplacementDetail, Boolean electricalWorkApplies, String electricalDetail, Boolean mechanicalWorkApplies, String mechanicalWorkCode, LocalDate quotedPartsDate, String quotedPartsSupplier) {
        this(budgetDate, reportStatusCode, laborWithoutVat, vatRate, partsTotal, estimatedDays, minimumCloseAmount, observations, authorizedByName, interestedName, benchStraighteningApplies, benchStraighteningDetail, alignmentApplies, alignmentDetail, balancingApplies, balancingDetail, glassReplacementApplies, glassReplacementDetail, electricalWorkApplies, electricalDetail, mechanicalWorkApplies, mechanicalWorkCode, quotedPartsDate, quotedPartsSupplier, null, null);
    }
}
