package com.tallerzapata.backend.application.casefile;

import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseFranchiseEntity;

import java.math.BigDecimal;
import java.util.Locale;

/** Defines the shared repair workflow and GRANIZO-only commercial boundaries. */
public final class InsuranceRepairCasePolicy {

    public boolean isInsuranceRepair(String caseTypeCode) {
        String normalized = normalize(caseTypeCode);
        return "TODO_RIESGO".equals(normalized) || "GRANIZO".equals(normalized);
    }

    public boolean isGranizo(String caseTypeCode) {
        return "GRANIZO".equals(normalize(caseTypeCode));
    }

    public boolean allowsFranchise(String caseTypeCode) {
        return isInsuranceRepair(caseTypeCode) && !isGranizo(caseTypeCode);
    }

    public boolean allowsFranchiseRecovery(String caseTypeCode) {
        return allowsFranchise(caseTypeCode);
    }

    public boolean allowsCleasThirdParty(String caseTypeCode) {
        return !isGranizo(caseTypeCode);
    }

    public boolean requiresGranizoBackendIncident(String caseTypeCode) {
        return isGranizo(caseTypeCode);
    }

    public String folderPrefix(String caseTypeCode, String catalogPrefix) {
        return isGranizo(caseTypeCode) ? "G" : catalogPrefix;
    }

    public BigDecimal companyPaymentTarget(String caseTypeCode, BigDecimal agreedAmount, CaseFranchiseEntity franchise) {
        if (isGranizo(caseTypeCode)) {
            return agreedAmount;
        }

        BigDecimal agreement = agreedAmount == null ? BigDecimal.ZERO : agreedAmount;
        if (franchise != null && "PROPIA_CIA".equals(normalize(franchise.getRecoveryTypeCode()))) {
            return agreement;
        }
        BigDecimal franchiseAmount = franchise == null || franchise.getFranchiseAmount() == null
                ? BigDecimal.ZERO
                : franchise.getFranchiseAmount();
        return agreement.subtract(franchiseAmount).max(BigDecimal.ZERO);
    }

    public String normalize(String caseTypeCode) {
        return caseTypeCode == null ? "" : caseTypeCode.trim().toUpperCase(Locale.ROOT);
    }
}
