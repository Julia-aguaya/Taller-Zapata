package com.tallerzapata.backend.infrastructure.persistence.operation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleIntakeItemTypeRepository extends JpaRepository<VehicleIntakeItemTypeEntity, String> {

    boolean existsByCodeAndActiveTrue(String code);

    List<VehicleIntakeItemTypeEntity> findByActiveTrueOrderByNameAsc();
}
