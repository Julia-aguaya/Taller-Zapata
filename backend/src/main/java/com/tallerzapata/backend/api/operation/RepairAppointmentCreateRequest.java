package com.tallerzapata.backend.api.operation;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record RepairAppointmentCreateRequest(
        @NotNull LocalDate appointmentDate,
        @NotNull LocalTime appointmentTime,
        @Min(0) Integer estimatedDays,
        LocalDate estimatedExitDate,
        String statusCode,
        Boolean reentry,
        String notes,
        @NotNull Long userId
) {
}
