package com.tallerzapata.backend.api.casefile;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record CaseCreateRequest(
        @NotNull Long caseTypeId,
        Long organizationId,
        Long branchId,
        @NotNull Long principalVehicleId,
        @NotNull Long principalCustomerPersonId,
        Boolean referenced,
        Long referredByPersonId,
        Long referenciadorId,
        String referredByText,
        String priorityCode,
        String generalObservations,
        LocalDate incidentDate,
        LocalTime incidentTime,
        String incidentPlace,
        String incidentDynamics,
        String incidentObservations,
        LocalDate prescriptionDate,
        Integer daysInProcess,
        String customerRoleCode,
        String principalVehicleRoleCode
) {
}
