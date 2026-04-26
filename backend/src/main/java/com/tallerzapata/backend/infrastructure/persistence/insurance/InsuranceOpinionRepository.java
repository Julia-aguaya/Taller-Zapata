package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;
public interface InsuranceOpinionRepository extends JpaRepository<InsuranceOpinionEntity, String> { boolean existsByCodeAndActiveTrue(String code); }
