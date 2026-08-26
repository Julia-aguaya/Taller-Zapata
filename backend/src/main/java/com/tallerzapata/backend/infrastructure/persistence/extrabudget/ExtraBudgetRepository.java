package com.tallerzapata.backend.infrastructure.persistence.extrabudget;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface ExtraBudgetRepository extends JpaRepository<ExtraBudgetEntity, Long> {
    Optional<ExtraBudgetEntity> findByCaseId(Long caseId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select budget from ExtraBudgetEntity budget where budget.caseId = :caseId")
    Optional<ExtraBudgetEntity> findByCaseIdForUpdate(Long caseId);
}
