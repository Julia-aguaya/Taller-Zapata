package com.tallerzapata.backend.api.budget;

import com.tallerzapata.backend.api.casefile.CodeCatalogResponse;

import java.util.List;

public record BudgetCatalogsResponse(
        List<CodeCatalogResponse> reportStatusCodes,
        List<CodeCatalogResponse> taskCodes,
        List<CodeCatalogResponse> damageLevelCodes,
        List<CodeCatalogResponse> partDecisionCodes,
        List<CodeCatalogResponse> actionCodes
) {
}
