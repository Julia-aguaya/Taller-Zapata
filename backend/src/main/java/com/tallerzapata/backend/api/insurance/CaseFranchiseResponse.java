package com.tallerzapata.backend.api.insurance;

import java.math.BigDecimal;

public record CaseFranchiseResponse(
        Long id,
        Long caseId,
        String franchiseStatusCode,
        BigDecimal franchiseAmount,
        String recoveryTypeCode,
        Long relatedCaseId,
        String franchiseOpinionCode,
        Boolean exceedsFranchise,
        BigDecimal recoveryAmount,
        String notes
) {
}
