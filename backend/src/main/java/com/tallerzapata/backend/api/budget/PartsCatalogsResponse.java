package com.tallerzapata.backend.api.budget;

import com.tallerzapata.backend.api.casefile.CodeCatalogResponse;

import java.util.List;

public record PartsCatalogsResponse(
        List<CodeCatalogResponse> statusCodes,
        List<CodeCatalogResponse> purchasedByCodes,
        List<CodeCatalogResponse> paymentStatusCodes,
        List<CodeCatalogResponse> authorizationCodes
) {
}
