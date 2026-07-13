package com.tallerzapata.backend.api.casefile;

public record CaseWorkspaceRepairWidgetResponse(
        Boolean hasAppointment,
        Boolean hasIntake,
        Boolean hasDefinitiveOutcome
) {
}
