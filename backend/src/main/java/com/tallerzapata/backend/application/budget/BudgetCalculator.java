package com.tallerzapata.backend.application.budget;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class BudgetCalculator {

    private BudgetCalculator() {
    }

    public static BigDecimal calculateLaborVat(BigDecimal laborWithoutVat, BigDecimal vatRate) {
        if (laborWithoutVat == null || vatRate == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return laborWithoutVat.multiply(vatRate)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateLaborWithVat(BigDecimal laborWithoutVat, BigDecimal laborVat) {
        if (laborWithoutVat == null || laborVat == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return laborWithoutVat.add(laborVat);
    }

    public static BigDecimal calculateTotalQuoted(BigDecimal laborWithVat, BigDecimal partsTotal) {
        if (laborWithVat == null || partsTotal == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return laborWithVat.add(partsTotal);
    }

    public static BudgetCalculationResult calculateAll(BigDecimal laborWithoutVat, BigDecimal vatRate, BigDecimal partsTotal) {
        BigDecimal safeLaborWithoutVat = laborWithoutVat == null ? BigDecimal.ZERO : laborWithoutVat;
        BigDecimal safeVatRate = vatRate == null ? BigDecimal.ZERO : vatRate;
        BigDecimal safePartsTotal = partsTotal == null ? BigDecimal.ZERO : partsTotal;

        BigDecimal laborVat = calculateLaborVat(safeLaborWithoutVat, safeVatRate);
        BigDecimal laborWithVat = calculateLaborWithVat(safeLaborWithoutVat, laborVat);
        BigDecimal totalQuoted = calculateTotalQuoted(laborWithVat, safePartsTotal);

        return new BudgetCalculationResult(laborVat, laborWithVat, totalQuoted);
    }

    public record BudgetCalculationResult(BigDecimal laborVat, BigDecimal laborWithVat, BigDecimal totalQuoted) {
    }
}
