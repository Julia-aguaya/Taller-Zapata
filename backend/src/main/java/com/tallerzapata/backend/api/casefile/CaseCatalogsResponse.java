package com.tallerzapata.backend.api.casefile;

import java.util.List;

public record CaseCatalogsResponse(
        List<CaseTypeCatalogResponse> caseTypes,
        List<CodeCatalogResponse> customerRoleCodes,
        List<CodeCatalogResponse> principalVehicleRoleCodes,
        List<CodeCatalogResponse> priorityCodes,
        List<String> workflowDomains
) {
}
