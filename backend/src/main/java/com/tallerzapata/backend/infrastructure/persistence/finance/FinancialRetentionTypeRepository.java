package com.tallerzapata.backend.infrastructure.persistence.finance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FinancialRetentionTypeRepository extends JpaRepository<FinancialRetentionTypeEntity, String> {
    boolean existsByCodeAndActiveTrue(String code);
    List<FinancialRetentionTypeEntity> findByActiveTrueOrderByNameAsc();
}
