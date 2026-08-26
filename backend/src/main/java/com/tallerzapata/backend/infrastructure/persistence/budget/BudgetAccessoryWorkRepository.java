package com.tallerzapata.backend.infrastructure.persistence.budget;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BudgetAccessoryWorkRepository extends JpaRepository<BudgetAccessoryWorkEntity, Long> {
    List<BudgetAccessoryWorkEntity> findByBudgetIdOrderByIdAsc(Long budgetId);
    List<BudgetAccessoryWorkEntity> findByBudgetIdAndActiveTrueOrderByIdAsc(Long budgetId);
    void deleteByBudgetId(Long budgetId);
}
