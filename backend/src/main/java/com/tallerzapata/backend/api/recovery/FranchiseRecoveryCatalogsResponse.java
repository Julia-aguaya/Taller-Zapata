package com.tallerzapata.backend.api.recovery;

import com.tallerzapata.backend.api.casefile.CodeCatalogResponse;

import java.util.List;

public record FranchiseRecoveryCatalogsResponse(
        List<CodeCatalogResponse> managerCodes,
        List<CodeCatalogResponse> opinionCodes,
        List<CodeCatalogResponse> paymentStatusCodes
) {
}
