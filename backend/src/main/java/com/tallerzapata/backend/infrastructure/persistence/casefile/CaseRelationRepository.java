package com.tallerzapata.backend.infrastructure.persistence.casefile;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CaseRelationRepository extends JpaRepository<CaseRelationEntity, Long> {

    List<CaseRelationEntity> findBySourceCaseIdOrderByIdDesc(Long sourceCaseId);

    Optional<CaseRelationEntity> findBySourceCaseIdAndTargetCaseIdAndRelationTypeCode(Long sourceCaseId, Long targetCaseId, String relationTypeCode);
}
