package com.tallerzapata.backend.infrastructure.persistence.workflow;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CaseStateHistoryRepository extends JpaRepository<CaseStateHistoryEntity, Long> {

    List<CaseStateHistoryEntity> findByCaseIdOrderByStateDateDescIdDesc(Long caseId);
}
