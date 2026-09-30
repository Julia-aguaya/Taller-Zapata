package com.tallerzapata.backend.api.operation;

import java.time.LocalDate;

/** Fields owned by repair operations, never by the commercial budget. */
public record RepairPartUpdateRequest(
        String finalSupplier,
        String authorizationCode,
        String statusCode,
        String purchasedByCode,
        String paymentStatusCode,
        LocalDate receivedDate,
        Boolean used,
        Boolean returned,
        Long providerId
) {
}
