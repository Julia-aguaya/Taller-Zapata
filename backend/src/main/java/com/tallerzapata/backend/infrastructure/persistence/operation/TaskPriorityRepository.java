package com.tallerzapata.backend.infrastructure.persistence.operation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskPriorityRepository extends JpaRepository<TaskPriorityEntity, String> {

    boolean existsByCodeAndActiveTrue(String code);

    List<TaskPriorityEntity> findByActiveTrueOrderByVisualOrderAscNameAsc();
}
