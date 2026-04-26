package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;
public interface LegalClosureReasonRepository extends JpaRepository<LegalClosureReasonEntity, String> { boolean existsByCodeAndActiveTrue(String code); }
