package com.tallerzapata.backend.infrastructure.persistence.casefile;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CaseCreationIdempotencyRepository extends JpaRepository<CaseCreationIdempotencyEntity, Long> {
    Optional<CaseCreationIdempotencyEntity> findByUserIdAndIdempotencyKey(Long userId, String idempotencyKey);
}
