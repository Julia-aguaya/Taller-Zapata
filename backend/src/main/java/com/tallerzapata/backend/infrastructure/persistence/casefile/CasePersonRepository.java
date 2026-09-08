package com.tallerzapata.backend.infrastructure.persistence.casefile;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CasePersonRepository extends JpaRepository<CasePersonEntity, Long> {

    boolean existsByCaseIdAndPersonId(Long caseId, Long personId);

    boolean existsByCaseIdAndPrincipalTrue(Long caseId);

    java.util.Optional<CasePersonEntity> findByCaseIdAndPersonId(Long caseId, Long personId);

    java.util.Optional<CasePersonEntity> findByIdAndCaseId(Long id, Long caseId);

    java.util.Optional<CasePersonEntity> findByCaseIdAndPrincipalTrue(Long caseId);

    List<CasePersonEntity> findByCaseIdOrderByIdAsc(Long caseId);

    List<CasePersonEntity> findByCaseIdAndCaseRoleCodeOrderByIdAsc(Long caseId, String caseRoleCode);
}
