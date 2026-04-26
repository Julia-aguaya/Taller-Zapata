package com.tallerzapata.backend.infrastructure.persistence.vehicle;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleBrandRepository extends JpaRepository<VehicleBrandEntity, Long> {

    boolean existsByIdAndActivoTrue(Long id);

    List<VehicleBrandEntity> findByActivoTrueOrderByNombreAsc();
}
