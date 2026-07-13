package com.tallerzapata.backend.api.vehicle;

import com.tallerzapata.backend.api.casefile.CodeCatalogResponse;

import java.util.List;

public record VehicleCatalogsResponse(
        List<CodeCatalogResponse> vehicleTypeCodes,
        List<CodeCatalogResponse> usageCodes,
        List<CodeCatalogResponse> transmissionCodes
) {
}
