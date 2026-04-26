package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CaseCleasRepository extends JpaRepository<CaseCleasEntity, Long> {
    Optional<CaseCleasEntity> findByCaseId(Long caseId);
}
