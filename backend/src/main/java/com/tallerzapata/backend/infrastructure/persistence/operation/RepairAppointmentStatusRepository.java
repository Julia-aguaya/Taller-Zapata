package com.tallerzapata.backend.infrastructure.persistence.operation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RepairAppointmentStatusRepository extends JpaRepository<RepairAppointmentStatusEntity, String> {

    boolean existsByCodeAndActiveTrue(String code);

    List<RepairAppointmentStatusEntity> findByActiveTrueOrderByNameAsc();
}
