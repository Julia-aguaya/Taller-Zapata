package com.tallerzapata.backend.infrastructure.persistence.budget;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CasePartRepository extends JpaRepository<CasePartEntity, Long> { List<CasePartEntity> findByCaseIdOrderByIdAsc(Long caseId); }
