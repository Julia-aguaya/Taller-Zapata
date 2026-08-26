package com.tallerzapata.backend.application.extrabudget;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collection;

public final class ExtraBudgetCalculator {
    public static final BigDecimal VAT_RATE = new BigDecimal("21.00");

    private ExtraBudgetCalculator() {
    }

    public static Calculation calculate(Collection<ItemInput> items) {
        BigDecimal partsTotal = BigDecimal.ZERO;
        BigDecimal laborWithoutVat = BigDecimal.ZERO;

        if (items != null) {
            for (ItemInput item : items) {
                if (item == null) {
                    continue;
                }
                partsTotal = partsTotal.add(lineTotal(item.quantity(), item.partUnitAmount()));
                laborWithoutVat = laborWithoutVat.add(lineTotal(item.quantity(), item.laborUnitAmount()));
            }
        }

        partsTotal = money(partsTotal);
        laborWithoutVat = money(laborWithoutVat);
        BigDecimal laborVat = money(laborWithoutVat.multiply(VAT_RATE).movePointLeft(2));
        BigDecimal laborWithVat = money(laborWithoutVat.add(laborVat));
        return new Calculation(partsTotal, laborWithoutVat, laborVat, laborWithVat, money(partsTotal.add(laborWithVat)));
    }

    /** Canonical V72 formula: item parts plus one version-level labor amount, optionally taxed. */
    public static Calculation calculateCanonical(Collection<CanonicalItemInput> items, BigDecimal generalLaborAmount,
                                                 boolean generalLaborVatApplies) {
        BigDecimal partsTotal = BigDecimal.ZERO;
        if (items != null) {
            for (CanonicalItemInput item : items) {
                if (item != null && item.active()) partsTotal = partsTotal.add(safe(item.partsAmount()));
            }
        }
        partsTotal = money(partsTotal);
        BigDecimal laborWithoutVat = money(safe(generalLaborAmount));
        BigDecimal laborVat = generalLaborVatApplies
                ? money(laborWithoutVat.multiply(VAT_RATE).movePointLeft(2))
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal laborWithVat = money(laborWithoutVat.add(laborVat));
        return new Calculation(partsTotal, laborWithoutVat, laborVat, laborWithVat, money(partsTotal.add(laborWithVat)));
    }

    public static BigDecimal lineTotal(BigDecimal quantity, BigDecimal unitAmount) {
        return money(safe(quantity).multiply(safe(unitAmount)));
    }

    private static BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private static BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    public record ItemInput(BigDecimal quantity, BigDecimal partUnitAmount, BigDecimal laborUnitAmount) {
    }

    public record CanonicalItemInput(BigDecimal partsAmount, boolean active) {
    }

    public record Calculation(BigDecimal partsTotal, BigDecimal laborWithoutVat, BigDecimal laborVat,
                              BigDecimal laborWithVat, BigDecimal total) {
    }
}
