package com.tallerzapata.backend.api.budget;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CasePartUpdateRequest(
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
        Boolean returned
) {
}
