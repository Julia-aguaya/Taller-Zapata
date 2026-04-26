package com.tallerzapata.backend.api.insurance;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InsuranceProcessingUpsertRequest(
        LocalDate presentedAt,
        LocalDate inspectionForwardedAt,
        String modalityCode,
        String opinionCode,
        String quotationStatusCode,
        LocalDate quotationDate,
        BigDecimal agreedAmount,
        BigDecimal minimumCloseAmount,
        Boolean includesParts,
        String partsAuthorizationCode,
        String partsSupplierText,
        BigDecimal amountToBillCompany,
        BigDecimal finalAmountForWorkshop,
        Boolean noRepair,
        Boolean adminOverrideAppointment
) {
}
