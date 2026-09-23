package com.tallerzapata.backend.application.budget;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class BudgetActionLabelFormatterTest {
    @Test
    void formatsActionCodesForCustomerFacingPdfOutput() {
        assertThat(BudgetActionLabelFormatter.format("REEMPLAZAR_Y_CARGAR"))
                .isEqualTo("Reemplazar y cargar");
        assertThat(BudgetActionLabelFormatter.format("REEMPLAZAR_Y_PINTAR"))
                .isEqualTo("Reemplazar y pintar");
    }

    @Test
    void rendersMissingActionsAsDash() {
        assertThat(BudgetActionLabelFormatter.format(null)).isEqualTo("-");
        assertThat(BudgetActionLabelFormatter.format("  ")).isEqualTo("-");
    }
}
