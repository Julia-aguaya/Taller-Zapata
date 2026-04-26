package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;
public interface LegalInstanceRepository extends JpaRepository<LegalInstanceEntity, String> { boolean existsByCodeAndActiveTrue(String code); }
