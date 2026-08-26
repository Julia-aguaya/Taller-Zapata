package com.tallerzapata.backend.infrastructure.persistence.extrabudget;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ExtraBudgetComparisonQuoteRepository extends JpaRepository<ExtraBudgetComparisonQuoteEntity, Long> {
    List<ExtraBudgetComparisonQuoteEntity> findByPieceIdOrderByIdAsc(Long pieceId);
    Optional<ExtraBudgetComparisonQuoteEntity> findByPieceIdAndProviderId(Long pieceId, Long providerId);
}
