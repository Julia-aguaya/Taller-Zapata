package com.tallerzapata.backend.application.casefile;

import com.tallerzapata.backend.api.casefile.CaseReadinessResponse;
import com.tallerzapata.backend.api.casefile.CaseReadinessTabResponse;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetItemEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetItemRepository;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetRepository;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementEntity;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseFranchiseEntity;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseFranchiseRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseInsuranceEntity;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseInsuranceRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.InsuranceProcessingEntity;
import com.tallerzapata.backend.infrastructure.persistence.insurance.InsuranceProcessingRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.OperationalTaskRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.RepairAppointmentEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.RepairAppointmentRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleIntakeEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleIntakeRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleOutcomeEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleOutcomeRepository;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonEntity;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleEntity;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class CaseReadinessService {

    private final CaseRepository caseRepository;
    private final CaseTypeRepository caseTypeRepository;
    private final PersonRepository personRepository;
    private final VehicleRepository vehicleRepository;
    private final BudgetRepository budgetRepository;
    private final BudgetItemRepository budgetItemRepository;
    private final CasePartRepository casePartRepository;
    private final FinancialMovementRepository financialMovementRepository;
    private final RepairAppointmentRepository repairAppointmentRepository;
    private final VehicleIntakeRepository vehicleIntakeRepository;
    private final VehicleOutcomeRepository vehicleOutcomeRepository;
    private final CaseInsuranceRepository caseInsuranceRepository;
    private final InsuranceProcessingRepository insuranceProcessingRepository;
    private final CaseFranchiseRepository caseFranchiseRepository;
    private final OperationalTaskRepository operationalTaskRepository;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService caseAccessControlService;

    public CaseReadinessService(
            CaseRepository caseRepository,
            CaseTypeRepository caseTypeRepository,
            PersonRepository personRepository,
            VehicleRepository vehicleRepository,
            BudgetRepository budgetRepository,
            BudgetItemRepository budgetItemRepository,
            CasePartRepository casePartRepository,
            FinancialMovementRepository financialMovementRepository,
            RepairAppointmentRepository repairAppointmentRepository,
            VehicleIntakeRepository vehicleIntakeRepository,
            VehicleOutcomeRepository vehicleOutcomeRepository,
            CaseInsuranceRepository caseInsuranceRepository,
            InsuranceProcessingRepository insuranceProcessingRepository,
            CaseFranchiseRepository caseFranchiseRepository,
            OperationalTaskRepository operationalTaskRepository,
            CurrentUserService currentUserService,
            CaseAccessControlService caseAccessControlService
    ) {
        this.caseRepository = caseRepository;
        this.caseTypeRepository = caseTypeRepository;
        this.personRepository = personRepository;
        this.vehicleRepository = vehicleRepository;
        this.budgetRepository = budgetRepository;
        this.budgetItemRepository = budgetItemRepository;
        this.casePartRepository = casePartRepository;
        this.financialMovementRepository = financialMovementRepository;
        this.repairAppointmentRepository = repairAppointmentRepository;
        this.vehicleIntakeRepository = vehicleIntakeRepository;
        this.vehicleOutcomeRepository = vehicleOutcomeRepository;
        this.caseInsuranceRepository = caseInsuranceRepository;
        this.insuranceProcessingRepository = insuranceProcessingRepository;
        this.caseFranchiseRepository = caseFranchiseRepository;
        this.operationalTaskRepository = operationalTaskRepository;
        this.currentUserService = currentUserService;
        this.caseAccessControlService = caseAccessControlService;
    }

    @Transactional(readOnly = true)
    public CaseReadinessResponse getReadiness(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
        caseAccessControlService.requireCaseAccess(currentUser, caseEntity, "caso.ver");

        CaseTypeEntity caseType = caseTypeRepository.findById(caseEntity.getCaseTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe el tipo de tramite " + caseEntity.getCaseTypeId()));

        PersonEntity principalCustomer = caseEntity.getPrincipalCustomerPersonId() == null
                ? null
                : personRepository.findById(caseEntity.getPrincipalCustomerPersonId()).orElse(null);
        VehicleEntity principalVehicle = caseEntity.getPrincipalVehicleId() == null
                ? null
                : vehicleRepository.findById(caseEntity.getPrincipalVehicleId()).orElse(null);

        List<String> fichaBlockingReasons = collectTechnicalSheetBlockingReasons(caseEntity, principalCustomer, principalVehicle);
        List<CaseReadinessTabResponse> tabs = new ArrayList<>();
        tabs.add(toTab("FICHA_TECNICA", true, fichaBlockingReasons, List.of()));

        if ("PARTICULAR".equals(caseType.getCode())) {
            CaseReadinessTabResponse budgetTab = buildParticularBudgetReadiness(caseId, principalVehicle);
            tabs.add(budgetTab);
            tabs.add(buildParticularRepairReadiness(caseId, budgetTab.completed()));
            tabs.add(buildParticularPaymentsReadiness(caseId));
        } else if ("TODO_RIESGO".equals(caseType.getCode())) {
            CaseReadinessTabResponse tramiteTab = buildTodoRiesgoGestionTramiteReadiness(caseId);
            tabs.add(tramiteTab);
            CaseReadinessTabResponse budgetTab = buildTodoRiesgoPresupuestoReadiness(caseId, principalVehicle, tramiteTab.completed());
            tabs.add(budgetTab);
            tabs.add(buildTodoRiesgoReparacionReadiness(caseId, budgetTab.completed(), tramiteTab.completed()));
            tabs.add(buildTodoRiesgoPagosReadiness(caseId));
        } else if ("GRANIZO".equals(caseType.getCode())) {
            CaseReadinessTabResponse tramiteTab = buildGranizoGestionTramiteReadiness(caseId);
            tabs.add(tramiteTab);
            CaseReadinessTabResponse budgetTab = buildTodoRiesgoPresupuestoReadiness(caseId, principalVehicle, tramiteTab.completed());
            tabs.add(budgetTab);
            tabs.add(buildTodoRiesgoReparacionReadiness(caseId, budgetTab.completed(), tramiteTab.completed()));
            tabs.add(buildGranizoPagosReadiness(caseId));
        }

        return new CaseReadinessResponse(caseId, caseType.getCode(), tabs);
    }

    private CaseReadinessTabResponse buildParticularBudgetReadiness(Long caseId, VehicleEntity principalVehicle) {
        List<String> blockingReasons = new ArrayList<>();
        BudgetEntity budget = budgetRepository.findByCaseId(caseId).orElse(null);
        if (budget == null) {
            blockingReasons.add("Falta cargar el presupuesto");
            return toTab("PRESUPUESTO", true, blockingReasons, List.of());
        }

        if (!isVehicleCommerciallyComplete(principalVehicle)) {
            blockingReasons.add("Faltan datos del vehiculo requeridos para cerrar el presupuesto");
        }

        List<BudgetItemEntity> items = budgetItemRepository.findByBudgetIdOrderByVisualOrderAsc(budget.getId());
        if (items.isEmpty()) {
            blockingReasons.add("Falta cargar al menos un item de presupuesto");
        }
        if (items.stream().anyMatch(item -> isBlank(item.getAffectedPiece()))) {
            blockingReasons.add("Hay items sin pieza afectada");
        }
        if (items.stream().anyMatch(item -> isBlank(item.getTaskCode()))) {
            blockingReasons.add("Hay items sin tarea");
        }
        if (items.stream().anyMatch(item -> isBlank(item.getDamageLevelCode()))) {
            blockingReasons.add("Hay items sin nivel de dano");
        }
        if (!"CERRADO".equals(budget.getReportStatusCode())) {
            blockingReasons.add("El presupuesto todavia no fue cerrado");
        }

        return toTab("PRESUPUESTO", true, blockingReasons, List.of());
    }

    private CaseReadinessTabResponse buildParticularRepairReadiness(Long caseId, boolean budgetCompleted) {
        List<String> blockingReasons = new ArrayList<>();
        List<String> warningReasons = new ArrayList<>();

        boolean allowed = budgetCompleted;
        if (!budgetCompleted) {
            blockingReasons.add("Debe cerrar el presupuesto antes de avanzar a gestion reparacion");
            return toTab("GESTION_REPARACION", false, blockingReasons, warningReasons);
        }

        List<RepairAppointmentEntity> appointments = repairAppointmentRepository.findByCaseId(caseId, Sort.by(Sort.Direction.DESC, "appointmentDate", "id"));
        List<VehicleIntakeEntity> intakes = vehicleIntakeRepository.findByCaseId(caseId, Sort.by(Sort.Direction.DESC, "intakeAt", "id"));
        List<VehicleOutcomeEntity> outcomes = vehicleOutcomeRepository.findByCaseId(caseId, Sort.by(Sort.Direction.DESC, "outcomeAt", "id"));
        List<CasePartEntity> parts = casePartRepository.findByCaseIdOrderByIdAsc(caseId);

        if (appointments.isEmpty()) {
            blockingReasons.add("Falta agendar el turno de reparacion");
        }
        if (!parts.isEmpty() && parts.stream().anyMatch(part -> !"RECIBIDO".equals(normalizeCode(part.getStatusCode())))) {
            warningReasons.add("Hay repuestos pendientes de recibir");
        }
        if (appointments.stream().findFirst().isPresent() && intakes.isEmpty()) {
            blockingReasons.add("Falta registrar el ingreso del vehiculo");
        }
        if (!intakes.isEmpty() && outcomes.isEmpty()) {
            blockingReasons.add("Falta registrar el egreso del vehiculo");
        }

        VehicleOutcomeEntity lastOutcome = outcomes.stream().findFirst().orElse(null);
        if (lastOutcome != null && Boolean.TRUE.equals(lastOutcome.getShouldReenter())) {
            blockingReasons.add("El vehiculo debe reingresar para completar la reparacion");
        }

        boolean completed = lastOutcome != null && Boolean.TRUE.equals(lastOutcome.getDefinitive()) && !Boolean.TRUE.equals(lastOutcome.getShouldReenter());
        if (completed) {
            blockingReasons.clear();
        }

        return new CaseReadinessTabResponse(
                "GESTION_REPARACION",
                allowed,
                completed,
                completed ? "BLUE" : "RED",
                List.copyOf(blockingReasons),
                List.copyOf(warningReasons)
        );
    }

    private CaseReadinessTabResponse buildParticularPaymentsReadiness(Long caseId) {
        List<String> blockingReasons = new ArrayList<>();
        List<String> warningReasons = new ArrayList<>();

        BudgetEntity budget = budgetRepository.findByCaseId(caseId).orElse(null);
        if (budget == null) {
            blockingReasons.add("Falta presupuesto para calcular el total cotizado");
            return toTab("PAGOS", true, blockingReasons, warningReasons);
        }

        BigDecimal expectedTotal = scale(budget.getTotalQuoted());
        List<FinancialMovementEntity> movements = financialMovementRepository.findByCaseId(caseId, Sort.by(Sort.Direction.DESC, "movementAt", "id"));
        if (movements.isEmpty()) {
            blockingReasons.add("Todavia no se registraron pagos del cliente");
            return toTab("PAGOS", true, blockingReasons, warningReasons);
        }

        BigDecimal customerNet = BigDecimal.ZERO;
        boolean hasAdvancePayment = false;
        for (FinancialMovementEntity movement : movements) {
            if (!"CLIENTE".equals(normalizeCode(movement.getFlowOriginCode()))) {
                continue;
            }
            BigDecimal amount = scale(movement.getNetAmount());
            if ("INGRESO".equals(normalizeCode(movement.getMovementTypeCode()))
                    || ("AJUSTE".equals(normalizeCode(movement.getMovementTypeCode())) && amount.signum() >= 0)) {
                customerNet = customerNet.add(amount);
            } else {
                customerNet = customerNet.subtract(amount.abs());
            }
            if (Boolean.TRUE.equals(movement.getAdvancePayment())) {
                hasAdvancePayment = true;
            }
        }

        BigDecimal pendingBalance = expectedTotal.subtract(customerNet);
        if (customerNet.compareTo(BigDecimal.ZERO) <= 0) {
            blockingReasons.add("Todavia no se registraron pagos imputables al cliente");
        } else if (pendingBalance.compareTo(BigDecimal.ZERO) > 0) {
            blockingReasons.add("Queda saldo pendiente del cliente: " + pendingBalance.toPlainString());
        }

        if (hasAdvancePayment) {
            warningReasons.add("Hay una seña registrada; verificar cancelacion final del saldo");
        }

        return new CaseReadinessTabResponse(
                "PAGOS",
                true,
                blockingReasons.isEmpty(),
                blockingReasons.isEmpty() ? "BLUE" : "RED",
                List.copyOf(blockingReasons),
                List.copyOf(warningReasons)
        );
    }

    // ── TODO_RIESGO ──────────────────────────────────────────────

    private CaseReadinessTabResponse buildTodoRiesgoGestionTramiteReadiness(Long caseId) {
        List<String> blocking = new ArrayList<>();
        CaseInsuranceEntity insurance = caseInsuranceRepository.findByCaseId(caseId).orElse(null);
        InsuranceProcessingEntity processing = insuranceProcessingRepository.findByCaseId(caseId).orElse(null);
        CaseFranchiseEntity franchise = caseFranchiseRepository.findByCaseId(caseId).orElse(null);

        if (insurance == null || insurance.getInsuranceCompanyId() == null) {
            blocking.add("Falta seleccionar compania de seguro");
        }
        if (processing == null || processing.getQuotationDate() == null) {
            blocking.add("Falta ingresar fecha de cotizacion del siniestro");
        }
        if (franchise == null || franchise.getRecoveryTypeCode() == null) {
            blocking.add("Falta definir modo de recupero de franquicia");
        }
        if (processing == null || processing.getAgreedAmount() == null || processing.getQuotationDate() == null) {
            blocking.add("Falta acordar cotizacion con la Cia.");
        }

        boolean hasPendingTasks = operationalTaskRepository.findAll().stream()
                .anyMatch(t -> t.getCaseId().equals(caseId) && !Boolean.TRUE.equals(t.getResolved()));

        if (hasPendingTasks) {
            blocking.add("Hay tareas pendientes en la agenda");
        }

        return toTab("GESTION_TRAMITE", true, blocking, List.of());
    }

    private CaseReadinessTabResponse buildTodoRiesgoPresupuestoReadiness(Long caseId, VehicleEntity vehicle, boolean tramiteCompleted) {
        List<String> blocking = new ArrayList<>();

        if (!tramiteCompleted) {
            blocking.add("Debe completar Gestion del Tramite antes de cargar el presupuesto");
            return toTab("PRESUPUESTO", false, blocking, List.of());
        }

        BudgetEntity budget = budgetRepository.findByCaseId(caseId).orElse(null);
        if (budget == null) {
            blocking.add("Falta cargar el presupuesto");
            return toTab("PRESUPUESTO", true, blocking, List.of());
        }

        if (!isVehicleCommerciallyComplete(vehicle)) {
            blocking.add("Faltan datos del vehiculo requeridos para cerrar el presupuesto");
        }

        List<BudgetItemEntity> items = budgetItemRepository.findByBudgetIdOrderByVisualOrderAsc(budget.getId());
        if (items.isEmpty()) blocking.add("Falta cargar al menos un item de presupuesto");
        if (items.stream().anyMatch(item -> isBlank(item.getAffectedPiece()))) blocking.add("Hay items sin pieza afectada");
        if (items.stream().anyMatch(item -> isBlank(item.getTaskCode()))) blocking.add("Hay items sin tarea");
        if (items.stream().anyMatch(item -> isBlank(item.getDamageLevelCode()))) blocking.add("Hay items sin nivel de dano");
        if (!"CERRADO".equals(budget.getReportStatusCode())) blocking.add("El presupuesto todavia no fue cerrado");

        return toTab("PRESUPUESTO", true, blocking, List.of());
    }

    private CaseReadinessTabResponse buildTodoRiesgoReparacionReadiness(Long caseId, boolean budgetCompleted, boolean tramiteCompleted) {
        List<String> blocking = new ArrayList<>();

        if (!budgetCompleted || !tramiteCompleted) {
            if (!budgetCompleted) blocking.add("Debe cerrar el presupuesto antes de gestionar la reparacion");
            if (!tramiteCompleted) blocking.add("Debe completar Gestion del Tramite antes de gestionar la reparacion");
            return toTab("GESTION_REPARACION", false, blocking, List.of());
        }

        List<RepairAppointmentEntity> appointments = repairAppointmentRepository.findByCaseId(caseId, Sort.unsorted());
        List<VehicleIntakeEntity> intakes = vehicleIntakeRepository.findByCaseId(caseId, Sort.unsorted());
        List<VehicleOutcomeEntity> outcomes = vehicleOutcomeRepository.findByCaseId(caseId, Sort.unsorted());

        if (appointments.isEmpty()) blocking.add("Falta agendar el turno de reparacion");
        else if (intakes.isEmpty()) blocking.add("Falta registrar el ingreso del vehiculo");
        else if (!intakes.isEmpty() && outcomes.isEmpty()) blocking.add("Falta registrar el egreso del vehiculo");

        // Only complete if definitive exit and no reentry
        VehicleOutcomeEntity lastOutcome = outcomes.stream().max((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt())).orElse(null);
        boolean completed = lastOutcome != null && Boolean.TRUE.equals(lastOutcome.getDefinitive()) && !Boolean.TRUE.equals(lastOutcome.getShouldReenter());
        if (completed) blocking.clear();

        return new CaseReadinessTabResponse("GESTION_REPARACION", true, completed,
                completed ? "BLUE" : "RED", List.copyOf(blocking), List.of());
    }

    private CaseReadinessTabResponse buildTodoRiesgoPagosReadiness(Long caseId) {
        List<String> blocking = new ArrayList<>();
        InsuranceProcessingEntity processing = insuranceProcessingRepository.findByCaseId(caseId).orElse(null);

        if (processing == null || processing.getAgreedAmount() == null || processing.getQuotationDate() == null) {
            blocking.add("Falta acordar cotizacion con la Cia. antes de registrar pagos");
            return toTab("PAGOS", false, blocking, List.of());
        }

        CaseFranchiseEntity franchise = caseFranchiseRepository.findByCaseId(caseId).orElse(null);
        if (franchise != null && franchise.getFranchiseStatusCode() != null) {
            String franchiseStatus = franchise.getFranchiseStatusCode().toUpperCase();
            if ("PENDIENTE".equals(franchiseStatus)) {
                blocking.add("La franquicia sigue pendiente de resolucion");
            }
        }

        return toTab("PAGOS", true, blocking, List.of());
    }

    // ── GRANIZO ────────────────────────────────────────────────

    private CaseReadinessTabResponse buildGranizoGestionTramiteReadiness(Long caseId) {
        List<String> blocking = new ArrayList<>();
        CaseInsuranceEntity insurance = caseInsuranceRepository.findByCaseId(caseId).orElse(null);
        InsuranceProcessingEntity processing = insuranceProcessingRepository.findByCaseId(caseId).orElse(null);

        if (insurance == null || insurance.getInsuranceCompanyId() == null) {
            blocking.add("Falta seleccionar compania de seguro");
        }
        if (processing == null || processing.getAgreedAmount() == null || processing.getQuotationDate() == null) {
            blocking.add("Falta acordar cotizacion con la Cia.");
        }

        boolean hasPendingTasks = operationalTaskRepository.findAll().stream()
                .anyMatch(t -> t.getCaseId().equals(caseId) && !Boolean.TRUE.equals(t.getResolved()));
        if (hasPendingTasks) blocking.add("Hay tareas pendientes en la agenda");

        return toTab("GESTION_TRAMITE", true, blocking, List.of());
    }

    private CaseReadinessTabResponse buildGranizoPagosReadiness(Long caseId) {
        List<String> blocking = new ArrayList<>();
        InsuranceProcessingEntity processing = insuranceProcessingRepository.findByCaseId(caseId).orElse(null);

        if (processing == null || processing.getAgreedAmount() == null || processing.getQuotationDate() == null) {
            blocking.add("Falta acordar cotizacion con la Cia. antes de registrar pagos");
            return toTab("PAGOS", false, blocking, List.of());
        }

        return toTab("PAGOS", true, blocking, List.of());
    }

    // ── Helpers ──────────────────────────────────────────────────

    private List<String> collectTechnicalSheetBlockingReasons(CaseEntity caseEntity, PersonEntity principalCustomer, VehicleEntity principalVehicle) {
        List<String> reasons = new ArrayList<>();
        if (caseEntity.getPrincipalCustomerPersonId() == null || principalCustomer == null) {
            reasons.add("Falta cliente principal");
        } else if (isBlank(principalCustomer.getNombreMostrar())) {
            reasons.add("Falta nombre visible del cliente principal");
        }

        if (caseEntity.getPrincipalVehicleId() == null || principalVehicle == null) {
            reasons.add("Falta vehiculo principal");
        } else {
            if (isBlank(principalVehicle.getPlate())) {
                reasons.add("Falta dominio del vehiculo");
            }
            if (isBlank(principalVehicle.getBrandText()) && principalVehicle.getBrandId() == null) {
                reasons.add("Falta marca del vehiculo");
            }
            if (isBlank(principalVehicle.getModelText()) && principalVehicle.getModelId() == null) {
                reasons.add("Falta modelo del vehiculo");
            }
        }

        if (Boolean.TRUE.equals(caseEntity.getReferenced())
                && caseEntity.getReferredByPersonId() == null
                && isBlank(caseEntity.getReferredByText())) {
            reasons.add("El caso esta marcado como referenciado pero falta indicar quien lo refiere");
        }

        return reasons;
    }

    private boolean isVehicleCommerciallyComplete(VehicleEntity vehicle) {
        return vehicle != null
                && !isBlank(vehicle.getPlate())
                && (!isBlank(vehicle.getBrandText()) || vehicle.getBrandId() != null)
                && (!isBlank(vehicle.getModelText()) || vehicle.getModelId() != null);
    }

    private CaseReadinessTabResponse toTab(String tabCode, boolean allowed, List<String> blockingReasons, List<String> warningReasons) {
        boolean completed = blockingReasons.isEmpty();
        return new CaseReadinessTabResponse(
                tabCode,
                allowed,
                completed,
                completed ? "BLUE" : "RED",
                List.copyOf(blockingReasons),
                List.copyOf(warningReasons)
        );
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String normalizeCode(String value) {
        return isBlank(value) ? null : value.trim().toUpperCase();
    }

    private BigDecimal scale(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.setScale(2, java.math.RoundingMode.HALF_UP);
    }
}
