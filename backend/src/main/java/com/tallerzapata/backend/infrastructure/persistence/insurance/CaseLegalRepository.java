package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CaseLegalRepository extends JpaRepository<CaseLegalEntity, Long> { Optional<CaseLegalEntity> findByCaseId(Long caseId); }
