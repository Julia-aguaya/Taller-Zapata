package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;
public interface InsuranceModalityRepository extends JpaRepository<InsuranceModalityEntity, String> { boolean existsByCodeAndActiveTrue(String code); }
