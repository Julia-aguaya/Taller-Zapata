package com.tallerzapata.backend.infrastructure.persistence.vehicle;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleModelRepository extends JpaRepository<VehicleModelEntity, Long> {

    List<VehicleModelEntity> findByActivoTrueOrderByNombreAsc();

    List<VehicleModelEntity> findByBrandIdAndActivoTrueOrderByNombreAsc(Long brandId);
}
