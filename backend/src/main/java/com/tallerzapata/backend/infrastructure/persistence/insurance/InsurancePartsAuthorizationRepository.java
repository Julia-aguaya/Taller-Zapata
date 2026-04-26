package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;
public interface InsurancePartsAuthorizationRepository extends JpaRepository<InsurancePartsAuthorizationEntity, String> { boolean existsByCodeAndActiveTrue(String code); }
