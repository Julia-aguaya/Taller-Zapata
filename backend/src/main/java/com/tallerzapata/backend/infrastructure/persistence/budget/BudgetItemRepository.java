package com.tallerzapata.backend.infrastructure.persistence.budget;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BudgetItemRepository extends JpaRepository<BudgetItemEntity, Long> { List<BudgetItemEntity> findByBudgetIdOrderByVisualOrderAsc(Long budgetId); }
