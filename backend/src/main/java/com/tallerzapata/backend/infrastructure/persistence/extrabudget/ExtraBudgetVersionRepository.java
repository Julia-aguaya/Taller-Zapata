package com.tallerzapata.backend.infrastructure.persistence.extrabudget;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExtraBudgetVersionRepository extends JpaRepository<ExtraBudgetVersionEntity, Long> {
    Optional<ExtraBudgetVersionEntity> findByExtraBudgetIdAndVersionNumber(Long extraBudgetId, Integer versionNumber);
    List<ExtraBudgetVersionEntity> findByExtraBudgetIdOrderByVersionNumberAsc(Long extraBudgetId);
}
