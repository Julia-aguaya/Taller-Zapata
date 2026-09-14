package com.tallerzapata.backend.api.cleas;

import com.tallerzapata.backend.api.casefile.CaseIncidentUpdateRequest;
import com.tallerzapata.backend.application.vehicle.VehiclePlateNormalizer;
import jakarta.validation.constraints.AssertTrue;

public record CleasIncidentUpsertRequest(
        CaseIncidentUpdateRequest incident,
        String thirdPartyPlate
) {
    @AssertTrue(message = "thirdPartyPlate debe tener formato argentino AAA999 o AA999AA")
    public boolean isThirdPartyPlateValid() {
        String normalizedPlate = VehiclePlateNormalizer.normalize(thirdPartyPlate);
        return normalizedPlate == null || normalizedPlate.matches("(?:[A-Z]{3}[0-9]{3}|[A-Z]{2}[0-9]{3}[A-Z]{2})");
    }
}
