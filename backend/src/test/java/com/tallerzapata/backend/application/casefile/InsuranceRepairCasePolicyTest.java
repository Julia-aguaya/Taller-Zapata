package com.tallerzapata.backend.application.casefile;

import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseFranchiseEntity;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class InsuranceRepairCasePolicyTest {
    private final InsuranceRepairCasePolicy policy = new InsuranceRepairCasePolicy();

    @Test
    void recognizesNormalizedInsuranceRepairTypesAndGranizoCapabilities() {
        assertTrue(policy.isInsuranceRepair(" todo_riesgo "));
        assertTrue(policy.isInsuranceRepair("granizo"));
        assertFalse(policy.isInsuranceRepair("CLEAS"));
        assertFalse(policy.allowsFranchise("GRANIZO"));
        assertFalse(policy.allowsFranchiseRecovery("GRANIZO"));
        assertFalse(policy.allowsCleasThirdParty("GRANIZO"));
        assertTrue(policy.allowsFranchise("TODO_RIESGO"));
        assertFalse(policy.requiresGranizoBackendIncident("TODO_RIESGO"));
        assertTrue(policy.requiresGranizoBackendIncident("GRANIZO"));
        assertFalse(policy.requiresGranizoBackendIncident("PARTICULAR"));
    }

    @Test
    void mapsGranizoToCodeBasedFolderPrefix() {
        assertEquals("G", policy.folderPrefix("granizo", "incorrect"));
        assertEquals("T", policy.folderPrefix("TODO_RIESGO", "T"));
    }

    @Test
    void keepsFullAgreementForGranizoDespiteStaleFranchise() {
        CaseFranchiseEntity staleFranchise = new CaseFranchiseEntity();
        staleFranchise.setFranchiseAmount(new BigDecimal("200"));
        staleFranchise.setRecoveryTypeCode("TERCERO");

        assertEquals(new BigDecimal("1000"), policy.companyPaymentTarget("GRANIZO", new BigDecimal("1000"), staleFranchise));
        assertEquals(new BigDecimal("800"), policy.companyPaymentTarget("TODO_RIESGO", new BigDecimal("1000"), staleFranchise));
    }
}
