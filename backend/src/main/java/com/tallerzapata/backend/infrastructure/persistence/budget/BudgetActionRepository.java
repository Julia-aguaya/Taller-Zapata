package com.tallerzapata.backend.infrastructure.persistence.budget;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
public interface BudgetActionRepository extends JpaRepository<BudgetActionEntity, String> {
    boolean existsByCodeAndActiveTrue(String code);
    Optional<BudgetActionEntity> findByNormalizedName(String normalizedName);
}
