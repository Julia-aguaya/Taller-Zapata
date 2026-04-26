package com.tallerzapata.backend.infrastructure.persistence.vehicle;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<VehicleEntity, Long> {

    Optional<VehicleEntity> findByNormalizedPlate(String normalizedPlate);

    boolean existsByNormalizedPlate(String normalizedPlate);

    boolean existsByNormalizedPlateAndIdNot(String normalizedPlate, Long id);

    List<VehicleEntity> findByActivoTrueOrderByIdDesc(Pageable pageable);

    @Query("""
            select v
            from VehicleEntity v
            where v.activo = true
              and (
                lower(v.plate) like concat('%', :queryText, '%')
                or lower(coalesce(v.brandText, '')) like concat('%', :queryText, '%')
                or lower(coalesce(v.modelText, '')) like concat('%', :queryText, '%')
                or (:normalizedPlate <> '' and v.normalizedPlate like concat('%', :normalizedPlate, '%'))
              )
            order by v.id desc
            """)
    List<VehicleEntity> searchAutocomplete(
            @Param("queryText") String queryText,
            @Param("normalizedPlate") String normalizedPlate,
            Pageable pageable
    );
}
