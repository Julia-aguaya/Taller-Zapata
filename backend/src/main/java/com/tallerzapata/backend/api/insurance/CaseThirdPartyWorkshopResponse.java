package com.tallerzapata.backend.api.insurance;

public record CaseThirdPartyWorkshopResponse(
        Long caseId,
        Long thirdPartyCompanyId,
        String claimReference,
        Long thirdPartyVehicleId,
        Long driverCasePersonId,
        Long driverPersonId,
        CaseThirdPartyWorkshopContactResponse processor,
        CaseThirdPartyWorkshopContactResponse inspector
) {
}
