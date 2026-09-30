package com.tallerzapata.backend.application.casefile;

import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.workflow.WorkflowStateRepository;
import org.springframework.stereotype.Service;

@Service
public class DocumentationWorkflowStateService {
    private final WorkflowStateRepository workflowStateRepository;

    public DocumentationWorkflowStateService(WorkflowStateRepository workflowStateRepository) {
        this.workflowStateRepository = workflowStateRepository;
    }

    public boolean isComplete(CaseEntity caseEntity) {
        return caseEntity.getCurrentDocumentationStateId() != null
                && workflowStateRepository.findById(caseEntity.getCurrentDocumentationStateId())
                .map(state -> "DOCUMENTACION".equals(normalize(state.getDomain())) && "COMPLETA".equals(normalize(state.getCode())))
                .orElse(false);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }
}
