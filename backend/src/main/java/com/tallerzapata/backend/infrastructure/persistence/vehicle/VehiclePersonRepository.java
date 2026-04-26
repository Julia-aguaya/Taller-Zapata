package com.tallerzapata.backend.infrastructure.persistence.vehicle;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VehiclePersonRepository extends JpaRepository<VehiclePersonEntity, Long> {

    List<VehiclePersonEntity> findByVehicleIdOrderByEsActualDescIdDesc(Long vehicleId);

    Optional<VehiclePersonEntity> findByIdAndVehicleId(Long id, Long vehicleId);
}
