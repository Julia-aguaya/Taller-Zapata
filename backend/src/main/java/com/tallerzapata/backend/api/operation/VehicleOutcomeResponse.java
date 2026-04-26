package com.tallerzapata.backend.api.operation;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record VehicleOutcomeResponse(
        Long id,
        String publicId,
        Long caseId,
        Long intakeId,
        LocalDateTime outcomeAt,
        Long deliveredByUserId,
        Long receivedByPersonId,
        Boolean definitive,
        Boolean shouldReenter,
        LocalDate expectedReentryDate,
        Integer estimatedReentryDays,
        String reentryStatusCode,
        Boolean repairedPhotosUploaded,
        String notes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
