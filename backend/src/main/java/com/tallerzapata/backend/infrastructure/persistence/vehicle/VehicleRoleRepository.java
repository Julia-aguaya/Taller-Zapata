package com.tallerzapata.backend.infrastructure.persistence.vehicle;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleRoleRepository extends JpaRepository<VehicleRoleEntity, String> {

    boolean existsByCodeAndActiveTrue(String code);

    List<VehicleRoleEntity> findByActiveTrueOrderByNameAsc();
}
