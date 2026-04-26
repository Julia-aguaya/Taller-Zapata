package com.tallerzapata.backend.api.insurance;

import com.tallerzapata.backend.api.casefile.CodeCatalogResponse;

import java.util.List;

public record InsuranceCatalogsResponse(
        List<CodeCatalogResponse> companyContactRoleCodes,
        List<CodeCatalogResponse> modalityCodes,
        List<CodeCatalogResponse> opinionCodes,
        List<CodeCatalogResponse> quotationStatusCodes,
        List<CodeCatalogResponse> partsAuthorizationCodes,
        List<CodeCatalogResponse> franchiseStatusCodes,
        List<CodeCatalogResponse> franchiseRecoveryTypeCodes,
        List<CodeCatalogResponse> franchiseOpinionCodes,
        List<CodeCatalogResponse> cleasScopeCodes,
        List<CodeCatalogResponse> cleasOpinionCodes,
        List<CodeCatalogResponse> paymentStatusCodes,
        List<CodeCatalogResponse> thirdPartyDocumentationStatusCodes,
        List<CodeCatalogResponse> partsProvisionModeCodes,
        List<CodeCatalogResponse> legalProcessorCodes,
        List<CodeCatalogResponse> legalClaimantCodes,
        List<CodeCatalogResponse> legalInstanceCodes,
        List<CodeCatalogResponse> legalClosureReasonCodes,
        List<CodeCatalogResponse> legalExpensePayerCodes
) {
}
