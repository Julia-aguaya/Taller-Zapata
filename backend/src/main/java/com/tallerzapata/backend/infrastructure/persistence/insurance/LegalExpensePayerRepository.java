package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;
public interface LegalExpensePayerRepository extends JpaRepository<LegalExpensePayerEntity, String> { boolean existsByCodeAndActiveTrue(String code); }
