package com.tallerzapata.backend.application.casefile.particular;

import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class V1ParticularFinancialBalanceService implements ParticularFinancialBalanceService {
    private static final Sort MOVEMENT_SORT = Sort.by(Sort.Direction.ASC, "id");
    private final BudgetRepository budgetRepository;
    private final FinancialMovementRepository financialMovementRepository;

    public V1ParticularFinancialBalanceService(BudgetRepository budgetRepository, FinancialMovementRepository financialMovementRepository) {
        this.budgetRepository = budgetRepository;
        this.financialMovementRepository = financialMovementRepository;
    }

    @Override
    public BigDecimal balanceFor(Long caseId) {
        BigDecimal totalQuoted = budgetRepository.findByCaseId(caseId)
                .map(budget -> zeroWhenNull(budget.getTotalQuoted()))
                .orElse(BigDecimal.ZERO);
        BigDecimal customerNet = financialMovementRepository.findByCaseId(caseId, MOVEMENT_SORT).stream()
                .filter(movement -> "CLIENTE".equals(normalize(movement.getFlowOriginCode())))
                .map(movement -> signedMovement(movement.getMovementTypeCode(), movement.getNetAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return totalQuoted.subtract(customerNet);
    }

    @Override
    public BigDecimal expectedQuotedTotal(Long caseId) {
        return budgetRepository.findByCaseId(caseId)
                .map(budget -> budget.getTotalQuoted())
                .orElse(null);
    }

    private BigDecimal signedMovement(String typeCode, BigDecimal amount) {
        BigDecimal value = zeroWhenNull(amount);
        return "INGRESO".equals(normalize(typeCode)) || ("AJUSTE".equals(normalize(typeCode)) && value.signum() >= 0)
                ? value : value.abs().negate();
    }

    private BigDecimal zeroWhenNull(BigDecimal value) { return value == null ? BigDecimal.ZERO : value; }
    private String normalize(String value) { return value == null ? "" : value.trim().toUpperCase(); }
}
