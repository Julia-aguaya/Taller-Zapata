package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BelowMinimumAgreementApprovalRepository extends JpaRepository<BelowMinimumAgreementApprovalEntity, Long> {
    Optional<BelowMinimumAgreementApprovalEntity> findByCaseId(Long caseId);
}
