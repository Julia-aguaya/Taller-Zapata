package com.tallerzapata.backend.api.casefile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record CaseCreateRequest(
        @NotNull Long caseTypeId,
        @NotNull Long organizationId,
        @NotNull Long branchId,
        @NotNull Long principalVehicleId,
        @NotNull Long principalCustomerPersonId,
        Boolean referenced,
        Long referredByPersonId,
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
        @NotBlank String customerRoleCode,
        @NotBlank String principalVehicleRoleCode
) {
}
