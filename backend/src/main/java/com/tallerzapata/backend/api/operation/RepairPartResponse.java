package com.tallerzapata.backend.api.operation;

import java.time.LocalDate;

public record RepairPartResponse(
        Long id,
        String description,
        String partCode,
        String finalSupplier,
        String authorizationCode,
        String statusCode,
        String purchasedByCode,
        String paymentStatusCode,
        LocalDate receivedDate,
        Boolean used,
        Boolean returned,
        Long providerId,
        String sourceType,
        Boolean accessory
) {
}
