package com.tallerzapata.backend.api.budget;

import com.tallerzapata.backend.api.casefile.CodeCatalogResponse;
import java.util.List;

public record QuoteCatalogsResponse(
    List<CodeCatalogResponse> billingTypes,
    List<CodeCatalogResponse> paymentMethods
) {}
