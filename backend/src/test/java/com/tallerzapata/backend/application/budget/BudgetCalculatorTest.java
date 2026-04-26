package com.tallerzapata.backend.application.budget;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BudgetCalculatorTest {

    @Test
    void shouldCalculateLaborVat() {
        BigDecimal laborWithoutVat = new BigDecimal("1000.00");
        BigDecimal vatRate = new BigDecimal("21.00");

        BigDecimal result = BudgetCalculator.calculateLaborVat(laborWithoutVat, vatRate);

        assertEquals(new BigDecimal("210.00"), result);
    }

    @Test
    void shouldCalculateLaborWithVat() {
        BigDecimal laborWithoutVat = new BigDecimal("1000.00");
        BigDecimal laborVat = new BigDecimal("210.00");

        BigDecimal result = BudgetCalculator.calculateLaborWithVat(laborWithoutVat, laborVat);

        assertEquals(new BigDecimal("1210.00"), result);
    }

    @Test
    void shouldCalculateTotalQuoted() {
        BigDecimal laborWithVat = new BigDecimal("1210.00");
        BigDecimal partsTotal = new BigDecimal("500.00");

        BigDecimal result = BudgetCalculator.calculateTotalQuoted(laborWithVat, partsTotal);

        assertEquals(new BigDecimal("1710.00"), result);
    }

    @Test
    void shouldCalculateAll() {
        BigDecimal laborWithoutVat = new BigDecimal("1000.00");
        BigDecimal vatRate = new BigDecimal("21.00");
        BigDecimal partsTotal = new BigDecimal("500.00");

        BudgetCalculator.BudgetCalculationResult result = BudgetCalculator.calculateAll(laborWithoutVat, vatRate, partsTotal);

        assertEquals(new BigDecimal("210.00"), result.laborVat());
        assertEquals(new BigDecimal("1210.00"), result.laborWithVat());
        assertEquals(new BigDecimal("1710.00"), result.totalQuoted());
    }

    @Test
    void shouldCalculateAllWithDecimalPrecision() {
        BigDecimal laborWithoutVat = new BigDecimal("999.99");
        BigDecimal vatRate = new BigDecimal("10.50");
        BigDecimal partsTotal = new BigDecimal("0.00");

        BudgetCalculator.BudgetCalculationResult result = BudgetCalculator.calculateAll(laborWithoutVat, vatRate, partsTotal);

        assertEquals(new BigDecimal("105.00"), result.laborVat());
        assertEquals(new BigDecimal("1104.99"), result.laborWithVat());
        assertEquals(new BigDecimal("1104.99"), result.totalQuoted());
    }

    @Test
    void shouldHandleNullsGracefully() {
        BudgetCalculator.BudgetCalculationResult result = BudgetCalculator.calculateAll(null, null, null);

        assertEquals(BigDecimal.ZERO.setScale(2), result.laborVat());
        assertEquals(BigDecimal.ZERO.setScale(2), result.laborWithVat());
        assertEquals(BigDecimal.ZERO.setScale(2), result.totalQuoted());
    }

    @Test
    void shouldReturnZeroForNullInputsInIndividualMethods() {
        assertEquals(BigDecimal.ZERO.setScale(2), BudgetCalculator.calculateLaborVat(null, new BigDecimal("21")));
        assertEquals(BigDecimal.ZERO.setScale(2), BudgetCalculator.calculateLaborWithVat(null, new BigDecimal("210")));
        assertEquals(BigDecimal.ZERO.setScale(2), BudgetCalculator.calculateTotalQuoted(null, new BigDecimal("500")));
    }
}
