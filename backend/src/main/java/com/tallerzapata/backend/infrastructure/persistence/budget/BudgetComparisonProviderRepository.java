package com.tallerzapata.backend.infrastructure.persistence.budget;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface BudgetComparisonProviderRepository extends JpaRepository<BudgetComparisonProviderEntity, Long> {
    List<BudgetComparisonProviderEntity> findBySnapshotIdOrderByIdAsc(Long snapshotId);
    Optional<BudgetComparisonProviderEntity> findByIdAndSnapshotId(Long id, Long snapshotId);
    boolean existsBySnapshotIdAndProviderId(Long snapshotId, Long providerId);
}
