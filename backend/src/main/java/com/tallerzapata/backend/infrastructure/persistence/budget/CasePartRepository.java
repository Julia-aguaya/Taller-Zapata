package com.tallerzapata.backend.infrastructure.persistence.budget;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface CasePartRepository extends JpaRepository<CasePartEntity, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select part from CasePartEntity part where part.id = :partId")
    Optional<CasePartEntity> findByIdForUpdate(Long partId);
    List<CasePartEntity> findByCaseIdOrderByIdAsc(Long caseId);
    boolean existsByCaseIdAndBudgetItemId(Long caseId, Long budgetItemId);
    Optional<CasePartEntity> findByCaseIdAndBudgetItemId(Long caseId, Long budgetItemId);
    Optional<CasePartEntity> findByCaseIdAndBudgetItemIdAndSourceTypeAndNonCanonicalFalse(Long caseId, Long budgetItemId, CasePartSourceType sourceType);
    Optional<CasePartEntity> findByCaseIdAndAccessoryWorkId(Long caseId, Long accessoryWorkId);
    Optional<CasePartEntity> findByCaseIdAndAccessoryWorkIdAndSourceTypeAndNonCanonicalFalse(Long caseId, Long accessoryWorkId, CasePartSourceType sourceType);
    Optional<CasePartEntity> findByCaseIdAndExtraBudgetItemIdAndSourceTypeAndNonCanonicalFalse(Long caseId, Long extraBudgetItemId, CasePartSourceType sourceType);
    List<CasePartEntity> findByCaseIdAndSourceTypeOrderByIdAsc(Long caseId, CasePartSourceType sourceType);
    boolean existsBySourceComparisonPieceId(Long sourceComparisonPieceId);
}
