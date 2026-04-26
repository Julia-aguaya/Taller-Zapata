package com.tallerzapata.backend.api.insurance;

import java.math.BigDecimal;

public record CaseThirdPartyResponse(
        Long id,
        Long caseId,
        Long thirdPartyCompanyId,
        String claimReference,
        String documentationStatusCode,
        Boolean documentationAccepted,
        String partsProvisionModeCode,
        BigDecimal minimumLaborAmount,
        BigDecimal minimumPartsAmount,
        BigDecimal bestQuotationSubtotal,
        BigDecimal finalPartsTotal,
        BigDecimal amountToBillCompany,
        BigDecimal finalAmountForWorkshop
) {
}
