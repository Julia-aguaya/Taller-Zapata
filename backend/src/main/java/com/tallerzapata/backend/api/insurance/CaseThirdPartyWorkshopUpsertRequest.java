package com.tallerzapata.backend.api.insurance;

import jakarta.validation.Valid;

public record CaseThirdPartyWorkshopUpsertRequest(
        Long thirdPartyCompanyId,
        String claimReference,
        Long thirdPartyVehicleId,
        Long driverPersonId,
        Long processorPersonId,
        @Valid ThirdPartyWorkshopContactRequest newProcessor,
        Long inspectorPersonId,
        @Valid ThirdPartyWorkshopContactRequest newInspector
) {
}
