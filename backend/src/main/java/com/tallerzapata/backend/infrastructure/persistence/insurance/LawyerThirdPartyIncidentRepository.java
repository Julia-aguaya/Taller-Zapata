package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LawyerThirdPartyIncidentRepository extends JpaRepository<LawyerThirdPartyIncidentEntity, Long> {
    Optional<LawyerThirdPartyIncidentEntity> findByCaseId(Long caseId);
}
