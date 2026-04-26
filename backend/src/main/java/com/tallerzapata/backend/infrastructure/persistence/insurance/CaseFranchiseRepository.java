package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CaseFranchiseRepository extends JpaRepository<CaseFranchiseEntity, Long> { Optional<CaseFranchiseEntity> findByCaseId(Long caseId); }
