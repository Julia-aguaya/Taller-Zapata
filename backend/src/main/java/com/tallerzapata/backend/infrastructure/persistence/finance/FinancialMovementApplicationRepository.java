package com.tallerzapata.backend.infrastructure.persistence.finance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FinancialMovementApplicationRepository extends JpaRepository<FinancialMovementApplicationEntity, Long> {
    List<FinancialMovementApplicationEntity> findByMovementIdOrderByIdAsc(Long movementId);
}
