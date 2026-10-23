package com.tallerzapata.backend.application.budget;

import com.tallerzapata.backend.infrastructure.persistence.organization.BranchEntity;
import com.tallerzapata.backend.infrastructure.persistence.organization.OrganizationEntity;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class BudgetPdfServiceTest {

    @Test
    void buildsLegalTextFromBranchFiscalData() {
        OrganizationEntity org = new OrganizationEntity();
        org.setRazonSocial("Talleres Zapata SRL");

        BranchEntity branch = new BranchEntity();
        branch.setCuit("30-71877589-9");
        branch.setCondicionIva("Responsable Inscripto");
        branch.setAddressLine1("Pje. Casablanca 2537");
        branch.setCity("Rosario");
        branch.setPhone("3414320467");
        branch.setWhatsapp("3415151270");
        branch.setEmail("administracion@tallereszapata.com");

        BudgetPdfService service = new BudgetPdfService(null, null);

        String text = service.buildLegalText(org, branch);

        assertThat(text).contains("Talleres Zapata SRL");
        assertThat(text).contains("CUIT: 30-71877589-9");
        assertThat(text).contains("IVA: Responsable Inscripto");
        assertThat(text).contains("Pje. Casablanca 2537, Rosario");
        assertThat(text).contains("Tel: 3414320467");
        assertThat(text).contains("Wsp: 3415151270");
        assertThat(text).contains("administracion@tallereszapata.com");
    }

    @Test
    void omitsContactChannelsThatAreNotConfigured() {
        OrganizationEntity org = new OrganizationEntity();
        org.setRazonSocial("Talleres Zapata SRL");

        BranchEntity branch = new BranchEntity();
        branch.setCuit("27-30891638-9");
        branch.setCondicionIva("Monotributista");
        branch.setAddressLine1("Pje. Casablanca 2520");
        branch.setCity("Rosario");
        branch.setWhatsapp("3415151270");
        branch.setEmail("casablanca@tallereszapata.com");

        BudgetPdfService service = new BudgetPdfService(null, null);

        String text = service.buildLegalText(org, branch);

        assertThat(text).contains("CUIT: 27-30891638-9");
        assertThat(text).contains("IVA: Monotributista");
        assertThat(text).contains("Wsp: 3415151270");
        assertThat(text).doesNotContain("Tel:");
    }
}
