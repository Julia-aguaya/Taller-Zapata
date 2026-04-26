package com.tallerzapata.backend.infrastructure.persistence.operation;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleIntakeRepository extends JpaRepository<VehicleIntakeEntity, Long> {

    List<VehicleIntakeEntity> findByCaseId(Long caseId, Sort sort);

    boolean existsByIdAndCaseId(Long id, Long caseId);
}
