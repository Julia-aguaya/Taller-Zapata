package com.tallerzapata.backend.infrastructure.persistence.extrabudget;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExtraBudgetEventRepository extends JpaRepository<ExtraBudgetEventEntity, Long> {
    List<ExtraBudgetEventEntity> findByExtraBudgetIdOrderByCreatedAtAsc(Long extraBudgetId);
}
