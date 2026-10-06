package com.tallerzapata.backend.infrastructure.persistence.recovery;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import java.util.*;
public interface FranchiseRecoveryClientObligationRepository extends JpaRepository<FranchiseRecoveryClientObligationEntity,Long>{
 Optional<FranchiseRecoveryClientObligationEntity> findByCaseIdAndTypeCode(Long caseId,String typeCode); List<FranchiseRecoveryClientObligationEntity> findByCaseIdOrderByIdAsc(Long caseId);
 @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select o from FranchiseRecoveryClientObligationEntity o where o.id = :id") Optional<FranchiseRecoveryClientObligationEntity> findByIdForUpdate(Long id);
}
