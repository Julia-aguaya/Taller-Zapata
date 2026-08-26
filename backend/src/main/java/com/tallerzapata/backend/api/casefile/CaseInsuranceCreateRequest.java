package com.tallerzapata.backend.api.casefile;

public record CaseInsuranceCreateRequest(
        Long insuranceCompanyId,
        Long processorPersonId,
        NewInsuranceContactRequest newProcessor,
        String claimNumber,
        String coverageDetail
) {
}
