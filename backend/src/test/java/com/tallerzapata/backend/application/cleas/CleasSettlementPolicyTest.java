package com.tallerzapata.backend.application.cleas;

import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseCleasEntity;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CleasSettlementPolicyTest {
    private final CleasSettlementPolicy policy = new CleasSettlementPolicy();

    private CaseCleasEntity cleas(String scope, String opinion) {
        CaseCleasEntity cleas = new CaseCleasEntity();
        cleas.setScopeCode(scope);
        cleas.setOpinionCode(opinion);
        return cleas;
    }

    @Test
    void settlesTotalDamageAsFullCompanyAmount() {
        CleasSettlement result = policy.settle(cleas("DANIO_TOTAL", "A_FAVOR"), new BigDecimal("2000000"));
        assertThat(result.franchiseAmount()).isEqualByComparingTo("0");
        assertThat(result.companyRequiredAmount()).isEqualByComparingTo("0");
        assertThat(result.customerChargeAmount()).isEqualByComparingTo("0");
        assertThat(result.amountToBillCompany()).isEqualByComparingTo("2000000");
    }

    @Test
    void settlesFavorableFranchiseWithoutCustomerCharge() {
        CaseCleasEntity cleas = cleas("FRANQUICIA", "A_FAVOR");
        cleas.setFranchiseAmount(new BigDecimal("1000000"));
        CleasSettlement result = policy.settle(cleas, new BigDecimal("2000000"));
        assertThat(result.franchiseAmount()).isEqualByComparingTo("1000000");
        assertThat(result.companyRequiredAmount()).isEqualByComparingTo("0");
        assertThat(result.customerChargeAmount()).isEqualByComparingTo("0");
        assertThat(result.amountToBillCompany()).isEqualByComparingTo("2000000");
    }

    @Test
    void settlesUnfavorableFranchiseWithPartialCompanyRequirement() {
        CaseCleasEntity cleas = cleas("FRANQUICIA", "EN_CONTRA");
        cleas.setFranchiseAmount(new BigDecimal("1000000"));
        cleas.setCompanyFranchisePaymentAmount(new BigDecimal("500000"));
        CleasSettlement result = policy.settle(cleas, new BigDecimal("2000000"));
        assertThat(result.franchiseAmount()).isEqualByComparingTo("1000000");
        assertThat(result.companyRequiredAmount()).isEqualByComparingTo("500000");
        assertThat(result.customerChargeAmount()).isEqualByComparingTo("500000");
        assertThat(result.amountToBillCompany()).isEqualByComparingTo("1500000");
    }

    @Test
    void settlesUnfavorableFranchiseWithFullCompanyRequirement() {
        CaseCleasEntity cleas = cleas("FRANQUICIA", "EN_CONTRA");
        cleas.setFranchiseAmount(new BigDecimal("1000000"));
        cleas.setCompanyFranchisePaymentAmount(new BigDecimal("1000000"));
        CleasSettlement result = policy.settle(cleas, new BigDecimal("2000000"));
        assertThat(result.customerChargeAmount()).isEqualByComparingTo("0");
        assertThat(result.amountToBillCompany()).isEqualByComparingTo("2000000");
    }

    @Test
    void clampsToZeroWhenAgreementIsBelowTheCustomerCharge() {
        CaseCleasEntity cleas = cleas("FRANQUICIA", "EN_CONTRA");
        cleas.setFranchiseAmount(new BigDecimal("1000000"));
        cleas.setCompanyFranchisePaymentAmount(new BigDecimal("0"));
        CleasSettlement result = policy.settle(cleas, new BigDecimal("600000"));
        assertThat(result.customerChargeAmount()).isEqualByComparingTo("1000000");
        assertThat(result.amountToBillCompany()).isEqualByComparingTo("0");
    }

    @Test
    void rejectsSharedFaultSettlement() {
        CaseCleasEntity cleas = cleas("FRANQUICIA", "CULPA_COMPARTIDA");
        cleas.setFranchiseAmount(new BigDecimal("1000000"));
        assertThatThrownBy(() -> policy.settle(cleas, new BigDecimal("2000000")))
                .isInstanceOf(ConflictException.class);
    }
}
