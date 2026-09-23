package com.tallerzapata.backend.infrastructure.persistence.cleasstate;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import java.util.Optional;
public interface CleasEffectiveStateRepository extends JpaRepository<CleasEffectiveStateEntity, Long> { Optional<CleasEffectiveStateEntity> findByCaseId(Long caseId); @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select state from CleasEffectiveStateEntity state where state.caseId = :caseId") Optional<CleasEffectiveStateEntity> findByCaseIdForUpdate(Long caseId); }
