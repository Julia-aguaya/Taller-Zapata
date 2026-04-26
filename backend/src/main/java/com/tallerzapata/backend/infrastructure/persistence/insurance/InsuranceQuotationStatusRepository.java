package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;
public interface InsuranceQuotationStatusRepository extends JpaRepository<InsuranceQuotationStatusEntity, String> { boolean existsByCodeAndActiveTrue(String code); }
