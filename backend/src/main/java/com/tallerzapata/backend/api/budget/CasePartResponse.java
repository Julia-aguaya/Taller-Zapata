package com.tallerzapata.backend.api.budget;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CasePartResponse(
        Long id,
        Long caseId,
        Long budgetItemId,
        String description,
        String partCode,
        String finalSupplier,
        String authorizationCode,
        String statusCode,
        String purchasedByCode,
        String paymentStatusCode,
        BigDecimal budgetedPrice,
        BigDecimal finalPrice,
        LocalDate receivedDate,
        Boolean used,
        Boolean returned,
        Long providerId,
        String sourceType,
        Long accessoryWorkId,
        Boolean accessory,
        Boolean nonCanonical,
        List<CasePartReconciliationWarningResponse> reconciliationWarnings
) {
}
