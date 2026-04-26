package com.tallerzapata.backend.api.operation;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record VehicleIntakeUpdateRequest(
        Long appointmentId,
        @NotNull Long vehicleId,
        @NotNull LocalDateTime intakeAt,
        @NotNull Long receivedByUserId,
        Long deliveredByPersonId,
        @Min(0) Integer mileage,
        String fuelCode,
        LocalDate estimatedExitDate,
        Boolean hasObservations,
        String observationDetail
) {
}
