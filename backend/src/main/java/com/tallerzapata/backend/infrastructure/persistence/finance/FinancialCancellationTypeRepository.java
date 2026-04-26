package com.tallerzapata.backend.infrastructure.persistence.finance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FinancialCancellationTypeRepository extends JpaRepository<FinancialCancellationTypeEntity, String> {
    boolean existsByCodeAndActiveTrue(String code);
    List<FinancialCancellationTypeEntity> findByActiveTrueOrderByNameAsc();
}
