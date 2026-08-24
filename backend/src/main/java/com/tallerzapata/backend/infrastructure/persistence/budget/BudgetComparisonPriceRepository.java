package com.tallerzapata.backend.infrastructure.persistence.budget;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface BudgetComparisonPriceRepository extends JpaRepository<BudgetComparisonPriceEntity, Long> {
    List<BudgetComparisonPriceEntity> findByPieceIdInOrderByIdAsc(Collection<Long> pieceIds);
    Optional<BudgetComparisonPriceEntity> findByPieceIdAndProviderColumnId(Long pieceId, Long providerColumnId);
    long countByProviderColumnId(Long providerColumnId);
}
