package com.tallerzapata.backend.infrastructure.persistence.recovery;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FranchiseRecoveryManagerRepository extends JpaRepository<FranchiseRecoveryManagerEntity, String> { boolean existsByCodeAndActiveTrue(String code); }
