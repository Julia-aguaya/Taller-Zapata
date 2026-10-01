package com.tallerzapata.backend.api.insurance;

public record LawyerThirdPartyIncidentUpsertRequest(
        String thirdPartyPlate,
        String thirdPartyMake,
        String thirdPartyModel,
        String driverName,
        String driverDni,
        String driverAddress,
        Boolean driverIsOwner,
        String ownerName,
        String ownerDni,
        String ownerAddress,
        Integer ownershipPercentage
) {
}
