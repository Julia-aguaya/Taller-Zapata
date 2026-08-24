package com.tallerzapata.backend.infrastructure.persistence.budget;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface BudgetComparisonOfferRepository extends JpaRepository<BudgetComparisonOfferEntity, Long> {
    List<BudgetComparisonOfferEntity> findByPieceIdInOrderByIdAsc(Collection<Long> pieceIds);
    List<BudgetComparisonOfferEntity> findByPieceIdOrderByIdAsc(Long pieceId);
}
