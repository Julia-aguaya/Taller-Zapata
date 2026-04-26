package com.tallerzapata.backend.infrastructure.persistence.casefile;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CaseVehicleRepository extends JpaRepository<CaseVehicleEntity, Long> {

    boolean existsByCaseIdAndVehicleId(Long caseId, Long vehicleId);

    boolean existsByCaseIdAndPrincipalTrue(Long caseId);
}
