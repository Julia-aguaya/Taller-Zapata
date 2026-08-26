package com.tallerzapata.backend.infrastructure.persistence.budget;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CasePartReconciliationWarningRepository extends JpaRepository<CasePartReconciliationWarningEntity, Long> {
    boolean existsByPartIdAndSourceTypeAndSourceIdAndState(Long partId, CasePartSourceType sourceType, Long sourceId, CasePartReconciliationWarningState state);
    List<CasePartReconciliationWarningEntity> findByCaseIdAndStateOrderByIdAsc(Long caseId, CasePartReconciliationWarningState state);
}
