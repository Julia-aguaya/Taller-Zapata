package com.tallerzapata.backend.infrastructure.persistence.budget;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface BudgetComparisonSnapshotRepository extends JpaRepository<BudgetComparisonSnapshotEntity, Long> {
    List<BudgetComparisonSnapshotEntity> findByCaseIdOrderByGenerationDesc(Long caseId);
    List<BudgetComparisonSnapshotEntity> findByCaseIdAndContextOrderByGenerationDesc(Long caseId, String context);
    Optional<BudgetComparisonSnapshotEntity> findByCaseIdAndIdempotencyKey(Long caseId, String idempotencyKey);
    Optional<BudgetComparisonSnapshotEntity> findByExtraBudgetVersionId(Long extraBudgetVersionId);
    Optional<BudgetComparisonSnapshotEntity> findByIdAndCaseId(Long id, Long caseId);
    Optional<BudgetComparisonSnapshotEntity> findTopByCaseIdOrderByGenerationDesc(Long caseId);
}
