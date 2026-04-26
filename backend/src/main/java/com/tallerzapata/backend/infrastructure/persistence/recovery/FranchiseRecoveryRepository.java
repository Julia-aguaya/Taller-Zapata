package com.tallerzapata.backend.infrastructure.persistence.recovery;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FranchiseRecoveryRepository extends JpaRepository<FranchiseRecoveryEntity, Long> { Optional<FranchiseRecoveryEntity> findByCaseId(Long caseId); }
