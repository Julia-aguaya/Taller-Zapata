package com.tallerzapata.backend.infrastructure.persistence.operation;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OperationalTaskRepository extends JpaRepository<OperationalTaskEntity, Long> {

    List<OperationalTaskEntity> findAll(Sort sort);
}
