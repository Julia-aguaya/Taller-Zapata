package com.tallerzapata.backend.api.casefile;

import com.tallerzapata.backend.api.budget.BudgetResponse;
import com.tallerzapata.backend.api.finance.FinanceCaseSummaryResponse;
import com.tallerzapata.backend.api.finance.FinanceParticularSummaryResponse;
import com.tallerzapata.backend.api.operation.RepairAppointmentResponse;
import com.tallerzapata.backend.api.operation.VehicleIntakeResponse;
import com.tallerzapata.backend.api.operation.VehicleOutcomeResponse;

public record CaseWorkspaceResponse(
        CaseResponse caseDetail,
        CaseReadinessResponse readiness,
        CaseWorkflowActionsResponse workflowActions,
        FinanceCaseSummaryResponse financeSummary,
        FinanceParticularSummaryResponse particularFinanceSummary,
        BudgetResponse budget,
        RepairAppointmentResponse latestAppointment,
        VehicleIntakeResponse latestIntake,
        VehicleOutcomeResponse latestOutcome,
        CaseWorkspaceWidgetsResponse widgets,
        CaseWorkshopInfoResponse workshopInfo
) {
}
