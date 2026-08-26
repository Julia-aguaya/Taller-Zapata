package com.tallerzapata.backend.application.extrabudget;

import com.tallerzapata.backend.infrastructure.persistence.extrabudget.ExtraBudgetStatus;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ExtraBudgetLifecycleTest {

    @Test
    void onlyAllowsSpecifiedLifecycleTransitions() {
        assertTrue(ExtraBudgetLifecycle.canTransition(ExtraBudgetStatus.BORRADOR, ExtraBudgetStatus.PRESENTADO));
        assertTrue(ExtraBudgetLifecycle.canTransition(ExtraBudgetStatus.PRESENTADO, ExtraBudgetStatus.ACEPTADO));
        assertTrue(ExtraBudgetLifecycle.canTransition(ExtraBudgetStatus.PRESENTADO, ExtraBudgetStatus.RECHAZADO));
        assertFalse(ExtraBudgetLifecycle.canTransition(ExtraBudgetStatus.BORRADOR, ExtraBudgetStatus.ACEPTADO));
        assertFalse(ExtraBudgetLifecycle.canTransition(ExtraBudgetStatus.ACEPTADO, ExtraBudgetStatus.BORRADOR));
    }

    @Test
    void onlyAllowsRevisionWithoutPaymentsAndAcceptsNoLowerThanPaid() {
        assertTrue(ExtraBudgetLifecycle.canRevise(ExtraBudgetStatus.ACEPTADO, BigDecimal.ZERO));
        assertFalse(ExtraBudgetLifecycle.canRevise(ExtraBudgetStatus.ACEPTADO, new BigDecimal("0.01")));
        assertTrue(ExtraBudgetLifecycle.canAccept(new BigDecimal("100.00"), new BigDecimal("100.00")));
        assertFalse(ExtraBudgetLifecycle.canAccept(new BigDecimal("99.99"), new BigDecimal("100.00")));
    }

    @Test
    void rejectsRevisionAndAcceptanceChangesAfterAnAcceptedExtraHasPayments() {
        BigDecimal paidExtraAmount = new BigDecimal("40.00");

        assertFalse(ExtraBudgetLifecycle.canRevise(ExtraBudgetStatus.ACEPTADO, paidExtraAmount));
        assertFalse(ExtraBudgetLifecycle.canAccept(new BigDecimal("39.99"), paidExtraAmount));
        assertTrue(ExtraBudgetLifecycle.canAccept(new BigDecimal("40.00"), paidExtraAmount));
    }
}
