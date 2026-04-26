package com.tallerzapata.backend.infrastructure.persistence.operation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleFuelCodeRepository extends JpaRepository<VehicleFuelCodeEntity, String> {

    boolean existsByCodeAndActiveTrue(String code);

    List<VehicleFuelCodeEntity> findByActiveTrueOrderByNameAsc();
}
