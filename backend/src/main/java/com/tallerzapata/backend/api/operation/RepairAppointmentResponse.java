package com.tallerzapata.backend.api.operation;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record RepairAppointmentResponse(
        Long id,
        String publicId,
        Long caseId,
        LocalDate appointmentDate,
        LocalTime appointmentTime,
        Integer estimatedDays,
        LocalDate estimatedExitDate,
        String statusCode,
        Boolean reentry,
        String notes,
        Long userId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
