package com.tallerzapata.backend.infrastructure.persistence.budget;

import org.springframework.data.jpa.repository.JpaRepository;
public interface BudgetReportStatusRepository extends JpaRepository<BudgetReportStatusEntity, String> { boolean existsByCodeAndActiveTrue(String code); }
