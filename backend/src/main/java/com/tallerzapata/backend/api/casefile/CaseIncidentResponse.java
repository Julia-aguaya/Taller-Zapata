package com.tallerzapata.backend.api.casefile;

import java.time.LocalDate;

public record CaseIncidentResponse(
        LocalDate incidentDate,
        String incidentTime,
        String location,
        String dynamics,
        String observations,
        LocalDate prescriptionDate
) {
}
