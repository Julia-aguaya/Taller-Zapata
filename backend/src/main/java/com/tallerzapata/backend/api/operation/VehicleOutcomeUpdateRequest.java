package com.tallerzapata.backend.api.operation;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record VehicleOutcomeUpdateRequest(
        @NotNull LocalDateTime outcomeAt,
        @NotNull Long deliveredByUserId,
        Long receivedByPersonId,
        Boolean definitive,
        Boolean shouldReenter,
        LocalDate expectedReentryDate,
        @Min(0) Integer estimatedReentryDays,
        String reentryStatusCode,
        Boolean repairedPhotosUploaded,
        String notes
) {
}
