package com.tallerzapata.backend.infrastructure.persistence.finance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FinancialMovementTypeRepository extends JpaRepository<FinancialMovementTypeEntity, String> {

    boolean existsByCodeAndActiveTrue(String code);

    List<FinancialMovementTypeEntity> findByActiveTrueOrderByNameAsc();
}
