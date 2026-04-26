package com.tallerzapata.backend.infrastructure.persistence.operation;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RepairAppointmentRepository extends JpaRepository<RepairAppointmentEntity, Long> {

    List<RepairAppointmentEntity> findByCaseId(Long caseId, Sort sort);
}
