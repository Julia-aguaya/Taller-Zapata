package com.tallerzapata.backend.application.extrabudget;

import com.tallerzapata.backend.infrastructure.persistence.extrabudget.ExtraBudgetStatus;

import java.math.BigDecimal;

public final class ExtraBudgetLifecycle {
    private ExtraBudgetLifecycle() {
    }

    public static boolean canTransition(ExtraBudgetStatus from, ExtraBudgetStatus to) {
        return (from == ExtraBudgetStatus.BORRADOR && to == ExtraBudgetStatus.PRESENTADO)
                || (from == ExtraBudgetStatus.PRESENTADO
                && (to == ExtraBudgetStatus.ACEPTADO || to == ExtraBudgetStatus.RECHAZADO));
    }

    public static boolean canRevise(ExtraBudgetStatus status, BigDecimal paidAmount) {
        return status == ExtraBudgetStatus.ACEPTADO
                && (paidAmount == null || paidAmount.signum() == 0);
    }

    public static boolean canAccept(BigDecimal acceptedTotal, BigDecimal paidAmount) {
        return acceptedTotal != null
                && (paidAmount == null || acceptedTotal.compareTo(paidAmount) >= 0);
    }
}
