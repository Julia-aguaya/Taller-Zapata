package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ThirdPartyWorkshopRetentionRepository extends JpaRepository<ThirdPartyWorkshopRetentionEntity, Long> {
    List<ThirdPartyWorkshopRetentionEntity> findByCaseIdOrderByRetentionTypeCodeAsc(Long caseId);
    void deleteByCaseId(Long caseId);
}
