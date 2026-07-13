package com.tallerzapata.backend.application.casefile;

import com.tallerzapata.backend.api.budget.BudgetResponse;
import com.tallerzapata.backend.api.casefile.CaseWorkspaceBudgetWidgetResponse;
import com.tallerzapata.backend.api.casefile.CaseWorkspaceRepairWidgetResponse;
import com.tallerzapata.backend.api.casefile.CaseWorkspaceResponse;
import com.tallerzapata.backend.api.casefile.CaseWorkspaceWidgetsResponse;
import com.tallerzapata.backend.api.casefile.CaseWorkshopInfoResponse;
import com.tallerzapata.backend.api.finance.FinanceCaseSummaryResponse;
import com.tallerzapata.backend.api.finance.FinanceParticularSummaryResponse;
import com.tallerzapata.backend.api.operation.RepairAppointmentResponse;
import com.tallerzapata.backend.api.operation.VehicleIntakeResponse;
import com.tallerzapata.backend.api.operation.VehicleOutcomeResponse;
import com.tallerzapata.backend.application.budget.BudgetService;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.finance.FinanceService;
import com.tallerzapata.backend.application.operation.RepairAppointmentService;
import com.tallerzapata.backend.application.operation.VehicleIntakeService;
import com.tallerzapata.backend.application.operation.VehicleOutcomeService;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.organization.BranchEntity;
import com.tallerzapata.backend.infrastructure.persistence.organization.BranchRepository;
import com.tallerzapata.backend.infrastructure.persistence.organization.OrganizationEntity;
import com.tallerzapata.backend.infrastructure.persistence.organization.OrganizationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CaseWorkspaceService {

    private final CaseService caseService;
    private final CaseReadinessService caseReadinessService;
    private final CaseWorkflowService caseWorkflowService;
    private final FinanceService financeService;
    private final BudgetService budgetService;
    private final BudgetRepository budgetRepository;
    private final RepairAppointmentService repairAppointmentService;
    private final VehicleIntakeService vehicleIntakeService;
    private final VehicleOutcomeService vehicleOutcomeService;
    private final CaseRepository caseRepository;
    private final OrganizationRepository organizationRepository;
    private final BranchRepository branchRepository;

    public CaseWorkspaceService(
            CaseService caseService,
            CaseReadinessService caseReadinessService,
            CaseWorkflowService caseWorkflowService,
            FinanceService financeService,
            BudgetService budgetService,
            BudgetRepository budgetRepository,
            RepairAppointmentService repairAppointmentService,
            VehicleIntakeService vehicleIntakeService,
            VehicleOutcomeService vehicleOutcomeService,
            CaseRepository caseRepository,
            OrganizationRepository organizationRepository,
            BranchRepository branchRepository
    ) {
        this.caseService = caseService;
        this.caseReadinessService = caseReadinessService;
        this.caseWorkflowService = caseWorkflowService;
        this.financeService = financeService;
        this.budgetService = budgetService;
        this.budgetRepository = budgetRepository;
        this.repairAppointmentService = repairAppointmentService;
        this.vehicleIntakeService = vehicleIntakeService;
        this.vehicleOutcomeService = vehicleOutcomeService;
        this.caseRepository = caseRepository;
        this.organizationRepository = organizationRepository;
        this.branchRepository = branchRepository;
    }

    @Transactional(readOnly = true)
    public CaseWorkspaceResponse getWorkspace(Long caseId) {
        var caseDetail = caseService.getById(caseId);
        var readiness = caseReadinessService.getReadiness(caseId);
        var workflowActions = caseWorkflowService.getAvailableActions(caseId, null);
        FinanceCaseSummaryResponse financeSummary = financeService.summarizeCase(caseId);
        FinanceParticularSummaryResponse particularFinanceSummary = financeService.summarizeParticularCase(caseId);

        BudgetResponse budget = null;
        if (budgetRepository.findByCaseId(caseId).isPresent()) {
            budget = budgetService.getBudget(caseId);
        }

        List<RepairAppointmentResponse> appointments = repairAppointmentService.listByCase(caseId);
        List<VehicleIntakeResponse> intakes = vehicleIntakeService.listByCase(caseId);
        List<VehicleOutcomeResponse> outcomes = vehicleOutcomeService.listByCase(caseId);

        RepairAppointmentResponse latestAppointment = appointments.isEmpty() ? null : appointments.get(0);
        VehicleIntakeResponse latestIntake = intakes.isEmpty() ? null : intakes.get(0);
        VehicleOutcomeResponse latestOutcome = outcomes.isEmpty() ? null : outcomes.get(0);

        CaseEntity caseEntity = caseRepository.findById(caseId).orElse(null);
        CaseWorkshopInfoResponse workshopInfo = buildWorkshopInfo(
                caseEntity != null ? caseEntity.getOrganizationId() : null,
                caseEntity != null ? caseEntity.getBranchId() : null
        );

        return new CaseWorkspaceResponse(
                caseDetail,
                readiness,
                workflowActions,
                financeSummary,
                particularFinanceSummary,
                budget,
                latestAppointment,
                latestIntake,
                latestOutcome,
                new CaseWorkspaceWidgetsResponse(
                        new CaseWorkspaceBudgetWidgetResponse(
                                budget != null,
                                budget == null ? null : budget.reportStatusCode(),
                                budget == null ? null : budget.totalQuoted()
                        ),
                        new CaseWorkspaceRepairWidgetResponse(
                                latestAppointment != null,
                                latestIntake != null,
                                latestOutcome != null && Boolean.TRUE.equals(latestOutcome.definitive()) && !Boolean.TRUE.equals(latestOutcome.shouldReenter())
                        )
                ),
                workshopInfo
        );
    }

    private CaseWorkshopInfoResponse buildWorkshopInfo(Long organizationId, Long branchId) {
        OrganizationEntity org = organizationId != null ? organizationRepository.findById(organizationId).orElse(null) : null;
        BranchEntity branch = branchId != null ? branchRepository.findById(branchId).orElse(null) : null;
        return new CaseWorkshopInfoResponse(
                org != null ? org.getName() : null,
                org != null ? org.getRazonSocial() : null,
                org != null ? org.getCuit() : null,
                org != null ? org.getCondicionIva() : null,
                branch != null ? branch.getCode() : null,
                branch != null ? branch.getName() : null,
                branch != null ? branch.getAddressLine1() : null,
                branch != null ? branch.getCity() : null,
                branch != null ? branch.getProvince() : null,
                branch != null ? branch.getPhone() : null,
                branch != null ? branch.getEmail() : null
        );
    }
}
