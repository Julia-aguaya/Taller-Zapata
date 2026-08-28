package com.tallerzapata.backend.infrastructure.persistence.casefile;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CaseVehicleRepository extends JpaRepository<CaseVehicleEntity, Long> {

    boolean existsByCaseIdAndVehicleId(Long caseId, Long vehicleId);

    boolean existsByCaseIdAndPrincipalTrue(Long caseId);

    List<CaseVehicleEntity> findByCaseIdAndVehicleRoleCodeOrderByIdAsc(Long caseId, String vehicleRoleCode);
}
