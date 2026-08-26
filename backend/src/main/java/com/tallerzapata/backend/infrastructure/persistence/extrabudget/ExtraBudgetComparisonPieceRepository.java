package com.tallerzapata.backend.infrastructure.persistence.extrabudget;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ExtraBudgetComparisonPieceRepository extends JpaRepository<ExtraBudgetComparisonPieceEntity, Long> {
    Optional<ExtraBudgetComparisonPieceEntity> findByItemId(Long itemId);
}
