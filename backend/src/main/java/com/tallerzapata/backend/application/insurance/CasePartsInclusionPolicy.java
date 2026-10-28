package com.tallerzapata.backend.application.insurance;

import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetAccessoryWorkRepository;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetItemEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetItemRepository;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetRepository;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartRepository;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartSourceType;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Set;

/** Canonical rule for whether a case carries parts in the insurance workflow. */
@Component
public class CasePartsInclusionPolicy {
    private final BudgetRepository budgetRepository;
    private final BudgetItemRepository budgetItemRepository;
    private final BudgetAccessoryWorkRepository budgetAccessoryWorkRepository;
    private final CasePartRepository casePartRepository;

    public CasePartsInclusionPolicy(BudgetRepository budgetRepository, BudgetItemRepository budgetItemRepository, BudgetAccessoryWorkRepository budgetAccessoryWorkRepository, CasePartRepository casePartRepository) {
        this.budgetRepository = budgetRepository;
        this.budgetItemRepository = budgetItemRepository;
        this.budgetAccessoryWorkRepository = budgetAccessoryWorkRepository;
        this.casePartRepository = casePartRepository;
    }

    public boolean includesParts(Long caseId) {
        BudgetEntity budget = budgetRepository.findByCaseId(caseId).orElse(null);
        if (budget == null) return hasIndependentPart(caseId);

        Set<Long> replacementBudgetItemIds = budgetItemRepository.findByBudgetIdOrderByVisualOrderAsc(budget.getId()).stream()
                .filter(this::isReplacementBudgetItem)
                .map(BudgetItemEntity::getId)
                .collect(java.util.stream.Collectors.toSet());
        if (!replacementBudgetItemIds.isEmpty()) return true;

        Set<Long> replacementAccessoryWorkIds = budgetAccessoryWorkRepository.findByBudgetIdAndActiveTrueOrderByIdAsc(budget.getId()).stream()
                .filter(work -> work.getActionCode() != null && work.getActionCode().startsWith("REEMPLAZAR"))
                .map(work -> work.getId())
                .collect(java.util.stream.Collectors.toSet());
        return casePartRepository.findByCaseIdOrderByIdAsc(caseId).stream()
                .anyMatch(part -> isCurrentPart(part, replacementBudgetItemIds, replacementAccessoryWorkIds));
    }

    private boolean hasIndependentPart(Long caseId) {
        return casePartRepository.findByCaseIdOrderByIdAsc(caseId).stream()
                .anyMatch(part -> part.getSourceType() == CasePartSourceType.MANUAL || part.getSourceType() == CasePartSourceType.EXTRA_BUDGET_ITEM);
    }

    private boolean isCurrentPart(CasePartEntity part, Set<Long> replacementBudgetItemIds, Set<Long> replacementAccessoryWorkIds) {
        return switch (part.getSourceType()) {
            case MANUAL, EXTRA_BUDGET_ITEM -> true;
            case BUDGET_ITEM -> replacementBudgetItemIds.contains(part.getBudgetItemId());
            case ACCESSORY_WORK -> replacementAccessoryWorkIds.contains(part.getAccessoryWorkId());
        };
    }

    private boolean isReplacementBudgetItem(BudgetItemEntity item) {
        return Boolean.TRUE.equals(item.getActive())
                && (Boolean.TRUE.equals(item.getRequiresReplacement()) || "REEMPLAZAR".equals(normalize(item.getPartDecisionCode())));
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toUpperCase(Locale.ROOT);
    }
}
