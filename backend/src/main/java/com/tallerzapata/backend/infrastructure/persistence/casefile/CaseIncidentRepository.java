package com.tallerzapata.backend.infrastructure.persistence.casefile;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CaseIncidentRepository extends JpaRepository<CaseIncidentEntity, Long> {

    Optional<CaseIncidentEntity> findByCaseId(Long caseId);
}
