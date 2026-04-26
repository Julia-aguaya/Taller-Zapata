package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InsuranceProcessingRepository extends JpaRepository<InsuranceProcessingEntity, Long> {
    Optional<InsuranceProcessingEntity> findByCaseId(Long caseId);
}
