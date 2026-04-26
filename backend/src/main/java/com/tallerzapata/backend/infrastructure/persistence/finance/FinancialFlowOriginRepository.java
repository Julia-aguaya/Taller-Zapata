package com.tallerzapata.backend.infrastructure.persistence.finance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FinancialFlowOriginRepository extends JpaRepository<FinancialFlowOriginEntity, String> {
    boolean existsByCodeAndActiveTrue(String code);
    List<FinancialFlowOriginEntity> findByActiveTrueOrderByNameAsc();
}
