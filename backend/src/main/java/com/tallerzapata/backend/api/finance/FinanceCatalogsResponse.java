package com.tallerzapata.backend.api.finance;

import com.tallerzapata.backend.api.casefile.CodeCatalogResponse;

import java.util.List;

public record FinanceCatalogsResponse(
        List<CodeCatalogResponse> movementTypeCodes,
        List<CodeCatalogResponse> flowOriginCodes,
        List<CodeCatalogResponse> counterpartyTypeCodes,
        List<CodeCatalogResponse> paymentMethodCodes,
        List<CodeCatalogResponse> cancellationTypeCodes,
        List<CodeCatalogResponse> retentionTypeCodes,
        List<CodeCatalogResponse> applicationConceptCodes,
        List<CodeCatalogResponse> receiptTypeCodes
) {
}
