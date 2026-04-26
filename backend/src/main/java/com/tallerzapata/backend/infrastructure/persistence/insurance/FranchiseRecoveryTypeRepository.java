package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;
public interface FranchiseRecoveryTypeRepository extends JpaRepository<FranchiseRecoveryTypeEntity, String> { boolean existsByCodeAndActiveTrue(String code); }
