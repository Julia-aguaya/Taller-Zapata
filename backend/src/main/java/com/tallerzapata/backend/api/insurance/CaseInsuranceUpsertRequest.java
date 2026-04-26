package com.tallerzapata.backend.api.insurance;

import jakarta.validation.constraints.NotNull;

public record CaseInsuranceUpsertRequest(
        @NotNull Long insuranceCompanyId,
        String policyNumber,
        String certificateNumber,
        String coverageDetail,
        Long thirdPartyCompanyId,
        String cleasNumber,
        Long processorCasePersonId,
        Long inspectorCasePersonId
) {
}
