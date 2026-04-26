package com.tallerzapata.backend.infrastructure.persistence.finance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FinancialApplicationConceptRepository extends JpaRepository<FinancialApplicationConceptEntity, String> {
    boolean existsByCodeAndActiveTrue(String code);
    List<FinancialApplicationConceptEntity> findByActiveTrueOrderByNameAsc();
}
