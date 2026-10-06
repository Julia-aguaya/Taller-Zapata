package com.tallerzapata.backend.infrastructure.persistence.recovery;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FranchiseRecoveryClientObligationPaymentApplicationRepository extends JpaRepository<FranchiseRecoveryClientObligationPaymentApplicationEntity, Long> {
    List<FranchiseRecoveryClientObligationPaymentApplicationEntity> findByObligationIdOrderByIdAsc(Long obligationId);
    Optional<FranchiseRecoveryClientObligationPaymentApplicationEntity> findByObligationIdAndIdempotencyKey(Long obligationId, String idempotencyKey);
    Optional<FranchiseRecoveryClientObligationPaymentApplicationEntity> findByIdAndObligationId(Long id, Long obligationId);
    boolean existsByReversedApplicationId(Long applicationId);
}
