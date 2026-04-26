package com.tallerzapata.backend.infrastructure.persistence.budget;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BudgetRepository extends JpaRepository<BudgetEntity, Long> { Optional<BudgetEntity> findByCaseId(Long caseId); }
