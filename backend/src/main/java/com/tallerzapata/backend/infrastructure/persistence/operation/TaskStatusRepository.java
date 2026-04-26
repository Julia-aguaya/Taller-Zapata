package com.tallerzapata.backend.infrastructure.persistence.operation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TaskStatusRepository extends JpaRepository<TaskStatusEntity, String> {

    Optional<TaskStatusEntity> findByCodeAndActiveTrue(String code);

    List<TaskStatusEntity> findByActiveTrueOrderByNameAsc();
}
