package com.tallerzapata.backend.infrastructure.persistence.budget;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface BudgetComparisonPieceRepository extends JpaRepository<BudgetComparisonPieceEntity, Long> {
    List<BudgetComparisonPieceEntity> findBySnapshotIdOrderByIdAsc(Long snapshotId);
    List<BudgetComparisonPieceEntity> findBySnapshotIdInOrderByIdAsc(Collection<Long> snapshotIds);
    Optional<BudgetComparisonPieceEntity> findByIdAndSnapshotId(Long id, Long snapshotId);
    Optional<BudgetComparisonPieceEntity> findBySnapshotIdAndSourceExtraBudgetItemId(Long snapshotId, Long sourceExtraBudgetItemId);
}
