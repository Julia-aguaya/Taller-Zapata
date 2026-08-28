package com.tallerzapata.backend.api.cleas;

import com.tallerzapata.backend.api.casefile.CaseIncidentResponse;

public record CleasIncidentResponse(
        CaseIncidentResponse incident,
        Long thirdPartyVehicleId
) {
}
