package com.tallerzapata.backend.application.budget;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class BudgetPdfServiceTest {

    @Test
    void resolvesTheInstitutionalBrandingOnlyForZapataBranch() {
        BudgetPdfService.BranchBranding branding = BudgetPdfService.brandingFor("TZ", "Z");

        assertThat(branding).isNotNull();
        assertThat(branding.institutionalTitle()).isEqualTo("ESTETICA DEL AUTOMOTOR");
        assertThat(branding.institutionalSubtitle()).isEqualTo("ZAPATA | Mecánica, chapearía & pintura");
        assertThat(branding.legalName()).isEqualTo("Talleres Zapata SRL");
        assertThat(branding.cuit()).isEqualTo("30-54986217-5");
        assertThat(branding.vatCondition()).isEqualTo("Responsable Inscripto");
        assertThat(branding.phone()).isEqualTo("3414261200");
        assertThat(branding.email()).isEqualTo("contacto@tallereszapata.com");
    }

    @Test
    void doesNotApplyZapataBrandingToAnotherBranch() {
        assertThat(BudgetPdfService.brandingFor("TZ", "C")).isNull();
    }
}
