package com.tallerzapata.backend.api.finance;

import java.math.BigDecimal;

/** Resumen de cobranza de la compañía contraparte para RECLAMO_TERCEROS gestionado por Taller. */
public record ThirdPartyWorkshopCompanyPaymentSummaryResponse(
        Long caseId,
        Long companyId,
        BigDecimal agreedAmount,
        BigDecimal validPaymentsNetAmount,
        BigDecimal validRetentionsAmount,
        BigDecimal netCompanyBalance
) {
}
