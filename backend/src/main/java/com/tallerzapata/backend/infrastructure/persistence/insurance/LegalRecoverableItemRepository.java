package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LegalRecoverableItemRepository extends JpaRepository<LegalRecoverableItemEntity, Long> {
    List<LegalRecoverableItemEntity> findByCaseLegalIdOrderByIdAsc(Long caseLegalId);
}
