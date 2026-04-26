package com.tallerzapata.backend.infrastructure.persistence.finance;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FinancialMovementRepository extends JpaRepository<FinancialMovementEntity, Long> {
    List<FinancialMovementEntity> findByCaseId(Long caseId, Sort sort);
}
