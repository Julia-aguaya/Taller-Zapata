package com.tallerzapata.backend.infrastructure.persistence.particularstate;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ParticularEffectiveStateHistoryRepository extends JpaRepository<ParticularEffectiveStateHistoryEntity, Long> {
}
