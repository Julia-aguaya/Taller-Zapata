package com.tallerzapata.backend.infrastructure.persistence.finance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FinancialCounterpartyTypeRepository extends JpaRepository<FinancialCounterpartyTypeEntity, String> {
    boolean existsByCodeAndActiveTrue(String code);
    List<FinancialCounterpartyTypeEntity> findByActiveTrueOrderByNameAsc();
}
