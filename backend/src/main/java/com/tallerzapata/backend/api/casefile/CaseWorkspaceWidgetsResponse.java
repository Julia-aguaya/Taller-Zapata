package com.tallerzapata.backend.api.casefile;

public record CaseWorkspaceWidgetsResponse(
        CaseWorkspaceBudgetWidgetResponse budget,
        CaseWorkspaceRepairWidgetResponse repair
) {
}
