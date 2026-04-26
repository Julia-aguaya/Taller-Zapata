package com.tallerzapata.backend.api.operation;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record VehicleIntakeResponse(
        Long id,
        String publicId,
        Long caseId,
        Long appointmentId,
        Long vehicleId,
        LocalDateTime intakeAt,
        Long receivedByUserId,
        Long deliveredByPersonId,
        Integer mileage,
        String fuelCode,
        LocalDate estimatedExitDate,
        Boolean hasObservations,
        String observationDetail,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
