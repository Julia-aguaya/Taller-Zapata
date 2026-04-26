package com.tallerzapata.backend.api.insurance;

public record CaseInsuranceResponse(
        Long id,
        Long caseId,
        Long insuranceCompanyId,
        String policyNumber,
        String certificateNumber,
        String coverageDetail,
        Long thirdPartyCompanyId,
        String cleasNumber,
        Long processorCasePersonId,
        Long inspectorCasePersonId
) {
}
