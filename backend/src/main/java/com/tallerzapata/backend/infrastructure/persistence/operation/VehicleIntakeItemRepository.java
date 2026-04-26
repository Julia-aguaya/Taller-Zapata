package com.tallerzapata.backend.infrastructure.persistence.operation;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleIntakeItemRepository extends JpaRepository<VehicleIntakeItemEntity, Long> {

    List<VehicleIntakeItemEntity> findByIntakeId(Long intakeId, Sort sort);
}
