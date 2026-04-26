package com.tallerzapata.backend.infrastructure.persistence.workflow;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkflowTransitionRepository extends JpaRepository<WorkflowTransitionEntity, Long> {

    List<WorkflowTransitionEntity> findByDomainAndSourceStateIdAndActiveTrue(String domain, Long sourceStateId);
}
