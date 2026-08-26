package com.tallerzapata.backend.infrastructure.persistence.extrabudget;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExtraBudgetItemRepository extends JpaRepository<ExtraBudgetItemEntity, Long> {
    List<ExtraBudgetItemEntity> findByExtraBudgetVersionIdOrderByVisualOrderAsc(Long extraBudgetVersionId);
    List<ExtraBudgetItemEntity> findByExtraBudgetVersionIdAndSourceTypeOrderByVisualOrderAsc(Long extraBudgetVersionId, String sourceType);
}
