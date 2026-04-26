package com.tallerzapata.backend.infrastructure.persistence.operation;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleOutcomeRepository extends JpaRepository<VehicleOutcomeEntity, Long> {

    List<VehicleOutcomeEntity> findByCaseId(Long caseId, Sort sort);

    boolean existsByIntakeId(Long intakeId);

    boolean existsByIdAndCaseId(Long id, Long caseId);
}
