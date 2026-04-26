package com.tallerzapata.backend.infrastructure.persistence.audit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AuditEventRepository extends JpaRepository<AuditEventEntity, Long> {

    List<AuditEventEntity> findByCaseIdOrderByIdDesc(Long caseId, Pageable pageable);
}
