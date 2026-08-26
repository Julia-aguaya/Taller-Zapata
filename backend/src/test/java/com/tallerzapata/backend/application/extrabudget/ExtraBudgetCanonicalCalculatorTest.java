package com.tallerzapata.backend.application.extrabudget;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ExtraBudgetCanonicalCalculatorTest {

    @Test
    void totalsOnlyActiveItemPartsAndAppliesVatAccordingToTheVersionLevelToggle() {
        var result = ExtraBudgetCalculator.calculateCanonical(List.of(
                new ExtraBudgetCalculator.CanonicalItemInput(new BigDecimal("100.005"), true),
                new ExtraBudgetCalculator.CanonicalItemInput(new BigDecimal("999.99"), false)
        ), new BigDecimal("50.005"), true);

        assertEquals(new BigDecimal("100.01"), result.partsTotal());
        assertEquals(new BigDecimal("50.01"), result.laborWithoutVat());
        assertEquals(new BigDecimal("10.50"), result.laborVat());
        assertEquals(new BigDecimal("60.51"), result.laborWithVat());
        assertEquals(new BigDecimal("160.52"), result.total());
    }

    @Test
    void omitsVatWhenTheVersionLevelToggleIsDisabled() {
        var result = ExtraBudgetCalculator.calculateCanonical(List.of(), new BigDecimal("100.00"), false);

        assertEquals(new BigDecimal("0.00"), result.laborVat());
        assertEquals(new BigDecimal("100.00"), result.total());
    }

    @Test
    void keepsAnEmptyDraftAtZeroWithoutCreatingDebt() {
        var result = ExtraBudgetCalculator.calculateCanonical(List.of(), BigDecimal.ZERO, true);

        assertEquals(new BigDecimal("0.00"), result.partsTotal());
        assertEquals(new BigDecimal("0.00"), result.laborVat());
        assertEquals(new BigDecimal("0.00"), result.total());
    }
}
