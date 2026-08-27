package com.tallerzapata.backend.application.casefile.particular;

import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementEntity;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class V1ParticularFinancialBalanceServiceTest {
    @Test
    void calculatesQuotedTotalMinusSignedCustomerNetMovementsOnly() {
        BudgetRepository budgets = mock(BudgetRepository.class);
        FinancialMovementRepository movements = mock(FinancialMovementRepository.class);
        BudgetEntity budget = new BudgetEntity();
        budget.setTotalQuoted(new BigDecimal("100.00"));
        when(budgets.findByCaseId(7L)).thenReturn(Optional.of(budget));
        when(movements.findByCaseId(org.mockito.ArgumentMatchers.eq(7L), any())).thenReturn(List.of(
                movement("CLIENTE", "INGRESO", "60.00"), movement("CLIENTE", "EGRESO", "10.00"), movement("ASEGURADORA", "INGRESO", "99.00")
        ));

        V1ParticularFinancialBalanceService service = new V1ParticularFinancialBalanceService(budgets, movements);
        assertEquals(new BigDecimal("50.00"), service.balanceFor(7L));
        assertEquals(new BigDecimal("100.00"), service.expectedQuotedTotal(7L));
    }

    @Test
    void missingBudgetHasNoExpectedTotalSoNothingCanBeReportedAsPaid() {
        BudgetRepository budgets = mock(BudgetRepository.class);
        FinancialMovementRepository movements = mock(FinancialMovementRepository.class);
        when(budgets.findByCaseId(7L)).thenReturn(Optional.empty());
        when(movements.findByCaseId(org.mockito.ArgumentMatchers.eq(7L), any())).thenReturn(List.of());

        V1ParticularFinancialBalanceService service = new V1ParticularFinancialBalanceService(budgets, movements);
        assertEquals(new BigDecimal("0"), service.balanceFor(7L));
        assertNull(service.expectedQuotedTotal(7L));
    }

    @Test
    void coversNoMovesPartialFullOverpaymentAndNegativeSignedCustomerMoves() {
        BudgetRepository budgets = mock(BudgetRepository.class);
        FinancialMovementRepository movements = mock(FinancialMovementRepository.class);
        BudgetEntity budget = new BudgetEntity();
        budget.setTotalQuoted(new BigDecimal("100.00"));
        when(budgets.findByCaseId(7L)).thenReturn(Optional.of(budget));
        V1ParticularFinancialBalanceService service = new V1ParticularFinancialBalanceService(budgets, movements);

        when(movements.findByCaseId(org.mockito.ArgumentMatchers.eq(7L), any())).thenReturn(List.of());
        assertEquals(new BigDecimal("100.00"), service.balanceFor(7L));

        when(movements.findByCaseId(org.mockito.ArgumentMatchers.eq(7L), any())).thenReturn(List.of(movement("CLIENTE", "INGRESO", "40.00")));
        assertEquals(new BigDecimal("60.00"), service.balanceFor(7L));

        when(movements.findByCaseId(org.mockito.ArgumentMatchers.eq(7L), any())).thenReturn(List.of(movement("CLIENTE", "INGRESO", "100.00")));
        assertEquals(0, BigDecimal.ZERO.compareTo(service.balanceFor(7L)));

        when(movements.findByCaseId(org.mockito.ArgumentMatchers.eq(7L), any())).thenReturn(List.of(movement("CLIENTE", "INGRESO", "125.00")));
        assertEquals(new BigDecimal("-25.00"), service.balanceFor(7L));

        when(movements.findByCaseId(org.mockito.ArgumentMatchers.eq(7L), any())).thenReturn(List.of(movement("CLIENTE", "AJUSTE", "-10.00")));
        assertEquals(new BigDecimal("110.00"), service.balanceFor(7L));
    }

    private FinancialMovementEntity movement(String origin, String type, String amount) {
        FinancialMovementEntity movement = new FinancialMovementEntity();
        movement.setFlowOriginCode(origin);
        movement.setMovementTypeCode(type);
        movement.setNetAmount(new BigDecimal(amount));
        return movement;
    }
}
