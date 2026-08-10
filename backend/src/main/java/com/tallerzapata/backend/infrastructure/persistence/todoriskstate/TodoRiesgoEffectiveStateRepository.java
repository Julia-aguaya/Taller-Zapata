package com.tallerzapata.backend.infrastructure.persistence.todoriskstate;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;

public interface TodoRiesgoEffectiveStateRepository extends JpaRepository<TodoRiesgoEffectiveStateEntity, Long> {
    Optional<TodoRiesgoEffectiveStateEntity> findByCaseId(Long caseId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select state from TodoRiesgoEffectiveStateEntity state where state.caseId = :caseId")
    Optional<TodoRiesgoEffectiveStateEntity> findByCaseIdForUpdate(Long caseId);
}
