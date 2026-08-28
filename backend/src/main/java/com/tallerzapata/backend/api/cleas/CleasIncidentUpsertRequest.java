package com.tallerzapata.backend.api.cleas;

import com.tallerzapata.backend.api.casefile.CaseIncidentUpdateRequest;

public record CleasIncidentUpsertRequest(
        CaseIncidentUpdateRequest incident,
        Long thirdPartyVehicleId
) {
}
