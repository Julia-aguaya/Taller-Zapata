package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;
public interface LegalClaimantRepository extends JpaRepository<LegalClaimantEntity, String> { boolean existsByCodeAndActiveTrue(String code); }
