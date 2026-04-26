package com.tallerzapata.backend.infrastructure.persistence.budget;

import org.springframework.data.jpa.repository.JpaRepository;
public interface BudgetTaskRepository extends JpaRepository<BudgetTaskEntity, String> { boolean existsByCodeAndActiveTrue(String code); }
