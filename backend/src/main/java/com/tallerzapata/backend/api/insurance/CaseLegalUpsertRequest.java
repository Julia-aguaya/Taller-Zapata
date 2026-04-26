package com.tallerzapata.backend.api.insurance;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CaseLegalUpsertRequest(
        String processorCode,
        String claimantCode,
        String instanceCode,
        LocalDate entryDate,
        String cuij,
        String court,
        String caseNumber,
        String counterpartLawyer,
        String counterpartPhone,
        String counterpartEmail,
        Boolean repairsVehicle,
        String closedByCode,
        LocalDate legalCloseDate,
        BigDecimal totalProceedsAmount,
        String observations,
        String closingNotes
) {
}
