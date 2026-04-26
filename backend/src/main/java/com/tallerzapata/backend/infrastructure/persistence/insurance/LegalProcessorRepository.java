package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;
public interface LegalProcessorRepository extends JpaRepository<LegalProcessorEntity, String> { boolean existsByCodeAndActiveTrue(String code); }
