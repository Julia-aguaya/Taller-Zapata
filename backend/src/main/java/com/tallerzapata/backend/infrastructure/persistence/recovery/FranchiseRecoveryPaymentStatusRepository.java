package com.tallerzapata.backend.infrastructure.persistence.recovery;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FranchiseRecoveryPaymentStatusRepository extends JpaRepository<FranchiseRecoveryPaymentStatusEntity, String> { boolean existsByCodeAndActiveTrue(String code); }
