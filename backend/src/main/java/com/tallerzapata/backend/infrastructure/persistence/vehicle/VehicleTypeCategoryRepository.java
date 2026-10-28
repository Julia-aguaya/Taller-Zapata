package com.tallerzapata.backend.infrastructure.persistence.vehicle;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VehicleTypeCategoryRepository extends JpaRepository<VehicleTypeCategoryEntity, String> {

    List<VehicleTypeCategoryEntity> findByActiveTrueOrderByNameAsc();

    Optional<VehicleTypeCategoryEntity> findByNormalizedName(String normalizedName);
}
