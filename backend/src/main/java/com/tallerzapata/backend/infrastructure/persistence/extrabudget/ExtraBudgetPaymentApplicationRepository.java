package com.tallerzapata.backend.infrastructure.persistence.extrabudget;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface ExtraBudgetPaymentApplicationRepository extends JpaRepository<ExtraBudgetPaymentApplicationEntity, Long> {
    boolean existsByMovementId(Long movementId);
    boolean existsByReversedApplicationId(Long reversedApplicationId);
    Optional<ExtraBudgetPaymentApplicationEntity> findByExtraBudgetIdAndMovementId(Long extraBudgetId, Long movementId);

    @Query("select coalesce(sum(application.appliedAmount), 0) from ExtraBudgetPaymentApplicationEntity application where application.extraBudgetId = :extraBudgetId")
    BigDecimal sumAppliedAmountByExtraBudgetId(Long extraBudgetId);

    List<ExtraBudgetPaymentApplicationEntity> findByExtraBudgetIdOrderByCreatedAtAsc(Long extraBudgetId);
}
