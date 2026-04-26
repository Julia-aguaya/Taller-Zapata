package com.tallerzapata.backend.infrastructure.persistence.recovery;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FranchiseRecoveryOpinionRepository extends JpaRepository<FranchiseRecoveryOpinionEntity, String> { boolean existsByCodeAndActiveTrue(String code); }
