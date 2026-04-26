package com.tallerzapata.backend.infrastructure.persistence.operation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleIntakeItemStatusRepository extends JpaRepository<VehicleIntakeItemStatusEntity, String> {

    boolean existsByCodeAndActiveTrue(String code);

    List<VehicleIntakeItemStatusEntity> findByActiveTrueOrderByNameAsc();
}
