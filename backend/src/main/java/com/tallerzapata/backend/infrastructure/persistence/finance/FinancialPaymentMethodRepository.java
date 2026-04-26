package com.tallerzapata.backend.infrastructure.persistence.finance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FinancialPaymentMethodRepository extends JpaRepository<FinancialPaymentMethodEntity, String> {
    boolean existsByCodeAndActiveTrue(String code);
    List<FinancialPaymentMethodEntity> findByActiveTrueOrderByNameAsc();
}
