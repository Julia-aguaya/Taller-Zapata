package com.tallerzapata.backend.api.casefile;

import java.util.List;

public record CaseWorkflowActionsResponse(
        Long caseId,
        List<CaseWorkflowActionResponse> actions
) {
}
