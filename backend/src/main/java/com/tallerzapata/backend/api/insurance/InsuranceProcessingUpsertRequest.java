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
        LocalDate agreementDate,
        LocalDate passedToPaymentsDate,
        BigDecimal minimumCloseAmount,
        Boolean includesParts,
        String partsAuthorizationCode,
        String partsSupplierText,
        Long providerId,
        BigDecimal amountToBillCompany,
        BigDecimal finalAmountForWorkshop,
        Boolean noRepair,
        Boolean adminOverrideAppointment,
        LocalDate passedToPaymentsAt,
        LocalDate estimatedPaymentDate
) {
    public InsuranceProcessingUpsertRequest(LocalDate presentedAt, LocalDate inspectionForwardedAt, String modalityCode, String opinionCode, String quotationStatusCode, LocalDate quotationDate, BigDecimal agreedAmount, LocalDate agreementDate, LocalDate passedToPaymentsDate, BigDecimal minimumCloseAmount, Boolean includesParts, String partsAuthorizationCode, String partsSupplierText, BigDecimal amountToBillCompany, BigDecimal finalAmountForWorkshop, Boolean noRepair, Boolean adminOverrideAppointment) {
        this(presentedAt, inspectionForwardedAt, modalityCode, opinionCode, quotationStatusCode, quotationDate, agreedAmount, agreementDate, passedToPaymentsDate, minimumCloseAmount, includesParts, partsAuthorizationCode, partsSupplierText, null, amountToBillCompany, finalAmountForWorkshop, noRepair, adminOverrideAppointment, null, null);
    }
}
