package com.tallerzapata.backend.infrastructure.persistence.finance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FinancialMovementRetentionRepository extends JpaRepository<FinancialMovementRetentionEntity, Long> {
    List<FinancialMovementRetentionEntity> findByMovementIdOrderByIdAsc(Long movementId);
}
