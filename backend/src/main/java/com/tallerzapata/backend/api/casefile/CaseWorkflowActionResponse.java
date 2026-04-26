package com.tallerzapata.backend.api.casefile;

public record CaseWorkflowActionResponse(
        String domain,
        String actionCode,
        Long sourceStateId,
        String sourceStateCode,
        Long targetStateId,
        String targetStateCode,
        String targetStateName,
        String requiredPermissionCode,
        Boolean automatic
) {
}
