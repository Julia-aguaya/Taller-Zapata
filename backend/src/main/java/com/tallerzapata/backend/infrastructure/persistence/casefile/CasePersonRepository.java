package com.tallerzapata.backend.infrastructure.persistence.casefile;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CasePersonRepository extends JpaRepository<CasePersonEntity, Long> {

    boolean existsByCaseIdAndPersonId(Long caseId, Long personId);

    boolean existsByCaseIdAndPrincipalTrue(Long caseId);
}
