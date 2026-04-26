package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CaseInsuranceRepository extends JpaRepository<CaseInsuranceEntity, Long> {
    Optional<CaseInsuranceEntity> findByCaseId(Long caseId);
}
