package com.tallerzapata.backend.infrastructure.persistence.extrabudget;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface ExtraBudgetBranchSequenceRepository extends JpaRepository<ExtraBudgetBranchSequenceEntity, ExtraBudgetBranchSequenceEntity.Id> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select sequence from ExtraBudgetBranchSequenceEntity sequence where sequence.id.organizationId = :organizationId and sequence.id.branchId = :branchId")
    Optional<ExtraBudgetBranchSequenceEntity> findByOrganizationIdAndBranchIdForUpdate(Long organizationId, Long branchId);
}
