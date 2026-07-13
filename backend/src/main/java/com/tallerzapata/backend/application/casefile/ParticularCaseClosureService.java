package com.tallerzapata.backend.application.casefile;

import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementEntity;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleOutcomeEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleOutcomeRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class ParticularCaseClosureService {

    private static final Sort MOVEMENT_SORT_ASC = Sort.by(Sort.Order.asc("movementAt"), Sort.Order.asc("id"));
    private static final Sort OUTCOME_SORT_DESC = Sort.by(Sort.Order.desc("outcomeAt"), Sort.Order.desc("id"));

    private final CaseRepository caseRepository;
    private final CaseTypeRepository caseTypeRepository;
    private final BudgetRepository budgetRepository;
    private final FinancialMovementRepository financialMovementRepository;
    private final VehicleOutcomeRepository vehicleOutcomeRepository;

    public ParticularCaseClosureService(
            CaseRepository caseRepository,
            CaseTypeRepository caseTypeRepository,
            BudgetRepository budgetRepository,
            FinancialMovementRepository financialMovementRepository,
            VehicleOutcomeRepository vehicleOutcomeRepository
    ) {
        this.caseRepository = caseRepository;
        this.caseTypeRepository = caseTypeRepository;
        this.budgetRepository = budgetRepository;
        this.financialMovementRepository = financialMovementRepository;
        this.vehicleOutcomeRepository = vehicleOutcomeRepository;
    }

    @Transactional
    public void syncClosure(Long caseId) {
        CaseEntity caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
        if (!isParticular(caseEntity.getCaseTypeId())) {
            return;
        }

        LocalDateTime definitiveOutcomeAt = resolveDefinitiveOutcomeAt(caseId);
        LocalDateTime paidInFullAt = resolvePaidInFullAt(caseId);

        if (definitiveOutcomeAt == null || paidInFullAt == null) {
            caseEntity.setClosedAt(null);
            caseRepository.save(caseEntity);
            return;
        }

        LocalDateTime closedAt = definitiveOutcomeAt.isAfter(paidInFullAt) ? definitiveOutcomeAt : paidInFullAt;
        caseEntity.setClosedAt(closedAt);
        caseRepository.save(caseEntity);
    }

    private boolean isParticular(Long caseTypeId) {
        CaseTypeEntity caseType = caseTypeRepository.findById(caseTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el tipo de tramite " + caseTypeId));
        return "PARTICULAR".equals(normalizeCode(caseType.getCode()));
    }

    private LocalDateTime resolveDefinitiveOutcomeAt(Long caseId) {
        return vehicleOutcomeRepository.findByCaseId(caseId, OUTCOME_SORT_DESC).stream()
                .filter(outcome -> Boolean.TRUE.equals(outcome.getDefinitive()) && !Boolean.TRUE.equals(outcome.getShouldReenter()))
                .map(VehicleOutcomeEntity::getOutcomeAt)
                .findFirst()
                .orElse(null);
    }

    private LocalDateTime resolvePaidInFullAt(Long caseId) {
        BudgetEntity budget = budgetRepository.findByCaseId(caseId).orElse(null);
        if (budget == null || budget.getTotalQuoted() == null) {
            return null;
        }

        BigDecimal expectedTotal = scale(budget.getTotalQuoted());
        BigDecimal accumulated = BigDecimal.ZERO;
        List<FinancialMovementEntity> movements = financialMovementRepository.findByCaseId(caseId, MOVEMENT_SORT_ASC);
        for (FinancialMovementEntity movement : movements) {
            if (!"CLIENTE".equals(normalizeCode(movement.getFlowOriginCode()))) {
                continue;
            }

            BigDecimal amount = scale(movement.getNetAmount());
            String type = normalizeCode(movement.getMovementTypeCode());
            if ("INGRESO".equals(type) || ("AJUSTE".equals(type) && amount.signum() >= 0)) {
                accumulated = accumulated.add(amount);
            } else {
                accumulated = accumulated.subtract(amount.abs());
            }

            if (accumulated.compareTo(expectedTotal) >= 0) {
                return movement.getMovementAt();
            }
        }

        return null;
    }

    private BigDecimal scale(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
    }

    private String normalizeCode(String value) {
        return value == null || value.isBlank() ? null : value.trim().toUpperCase(Locale.ROOT);
    }
}
