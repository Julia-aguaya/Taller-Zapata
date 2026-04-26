package com.tallerzapata.backend.infrastructure.persistence.budget;

import org.springframework.data.jpa.repository.JpaRepository;
public interface BudgetActionRepository extends JpaRepository<BudgetActionEntity, String> { boolean existsByCodeAndActiveTrue(String code); }
