package com.tallerzapata.backend.api.operation;

import com.tallerzapata.backend.api.casefile.CodeCatalogResponse;

import java.util.List;

public record OperationCatalogsResponse(
        List<CodeCatalogResponse> appointmentStatusCodes,
        List<CodeCatalogResponse> taskPriorityCodes,
        List<CodeCatalogResponse> taskStatusCodes,
        List<CodeCatalogResponse> fuelCodes,
        List<CodeCatalogResponse> intakeItemTypeCodes,
        List<CodeCatalogResponse> intakeItemStatusCodes,
        List<CodeCatalogResponse> reentryStatusCodes
) {
}
