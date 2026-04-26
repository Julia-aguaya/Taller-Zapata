package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CaseThirdPartyRepository extends JpaRepository<CaseThirdPartyEntity, Long> {
    Optional<CaseThirdPartyEntity> findByCaseId(Long caseId);
}
