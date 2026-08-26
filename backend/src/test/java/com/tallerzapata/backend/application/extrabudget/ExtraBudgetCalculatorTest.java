package com.tallerzapata.backend.application.extrabudget;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ExtraBudgetCalculatorTest {

    @Test
    void calculatesTwoDecimalHalfUpTotalsAndAppliesVatOnlyToLabor() {
        ExtraBudgetCalculator.Calculation result = ExtraBudgetCalculator.calculate(List.of(
                new ExtraBudgetCalculator.ItemInput(new BigDecimal("1.00"), new BigDecimal("100.005"), BigDecimal.ZERO),
                new ExtraBudgetCalculator.ItemInput(new BigDecimal("1.00"), BigDecimal.ZERO, new BigDecimal("100.005"))
        ));

        assertEquals(new BigDecimal("100.01"), result.partsTotal());
        assertEquals(new BigDecimal("100.01"), result.laborWithoutVat());
        assertEquals(new BigDecimal("21.00"), result.laborVat());
        assertEquals(new BigDecimal("121.01"), result.laborWithVat());
        assertEquals(new BigDecimal("221.02"), result.total());
    }

    @Test
    void keepsPartsOutsideVatEvenWhenTheMainOrInsurerTotalsWouldDiffer() {
        ExtraBudgetCalculator.Calculation result = ExtraBudgetCalculator.calculate(List.of(
                new ExtraBudgetCalculator.ItemInput(BigDecimal.ONE, new BigDecimal("500.00"), new BigDecimal("100.00"))
        ));

        assertEquals(new BigDecimal("500.00"), result.partsTotal());
        assertEquals(new BigDecimal("100.00"), result.laborWithoutVat());
        assertEquals(new BigDecimal("21.00"), result.laborVat());
        assertEquals(new BigDecimal("621.00"), result.total());
    }
}
