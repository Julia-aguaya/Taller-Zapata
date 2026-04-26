package com.tallerzapata.backend.application.workflow;

import java.util.HashSet;
import java.util.Set;

public final class WorkflowTransitionValidator {

    private final Set<String> allowedTransitions;

    public WorkflowTransitionValidator(Set<String> allowedTransitions) {
        this.allowedTransitions = new HashSet<>(allowedTransitions);
    }

    public boolean isValid(String fromState, String toState) {
        if (fromState == null || toState == null) {
            return false;
        }
        return allowedTransitions.contains(fromState + "->" + toState);
    }
}
