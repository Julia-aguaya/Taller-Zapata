package com.tallerzapata.backend.infrastructure.persistence.particularstate;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface ParticularEffectiveStateRepository extends JpaRepository<ParticularEffectiveStateEntity, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select state from ParticularEffectiveStateEntity state where state.caseId = :caseId")
    Optional<ParticularEffectiveStateEntity> findByCaseIdForUpdate(Long caseId);
}
