package com.tallerzapata.backend.infrastructure.persistence.workflow;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WorkflowStateRepository extends JpaRepository<WorkflowStateEntity, Long> {

    Optional<WorkflowStateEntity> findByDomainAndCode(String domain, String code);
}
