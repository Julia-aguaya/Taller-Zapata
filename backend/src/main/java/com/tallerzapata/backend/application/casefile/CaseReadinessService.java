package com.tallerzapata.backend.application.casefile;

import com.tallerzapata.backend.api.casefile.CaseReadinessResponse;
import com.tallerzapata.backend.api.casefile.CaseReadinessTabResponse;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.cleas.CleasClosurePolicy;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetItemEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetItemRepository;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetRepository;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseIncidentEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseIncidentRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CasePersonEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CasePersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementEntity;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseFranchiseEntity;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseFranchiseRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseInsuranceEntity;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseInsuranceRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseCleasEntity;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseCleasRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseLegalEntity;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseLegalRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseThirdPartyEntity;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseThirdPartyRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.InsuranceProcessingEntity;
import com.tallerzapata.backend.infrastructure.persistence.insurance.InsuranceProcessingRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.LegalLesionadoEntity;
import com.tallerzapata.backend.infrastructure.persistence.insurance.LegalLesionadoRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.RepairAppointmentEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.RepairAppointmentRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleIntakeEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleIntakeRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleOutcomeEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.VehicleOutcomeRepository;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonEntity;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.recovery.FranchiseRecoveryEntity;
import com.tallerzapata.backend.infrastructure.persistence.recovery.FranchiseRecoveryRepository;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleEntity;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class CaseReadinessService {

    /** Reclamos que exigen lesionados cargados (catalogo quienes_reclaman_legal). */
    private static final java.util.Set<String> CLAIMS_WITH_INJURIES = java.util.Set.of("DANIO_MATERIAL_LESIONES", "FRANQUICIA_LESIONES");

    private final CaseRepository caseRepository;
    private final CaseTypeRepository caseTypeRepository;
    private final CaseIncidentRepository caseIncidentRepository;
    private final CasePersonRepository casePersonRepository;
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
    private final FranchiseRecoveryRepository franchiseRecoveryRepository;
    private final CaseCleasRepository caseCleasRepository;
    private final CaseThirdPartyRepository caseThirdPartyRepository;
    private final CaseLegalRepository caseLegalRepository;
    private final LegalLesionadoRepository legalLesionadoRepository;
    private final CleasClosurePolicy cleasClosurePolicy;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService caseAccessControlService;
    private final InsuranceRepairCasePolicy insuranceRepairCasePolicy = new InsuranceRepairCasePolicy();

    public CaseReadinessService(
            CaseRepository caseRepository,
            CaseTypeRepository caseTypeRepository,
            CaseIncidentRepository caseIncidentRepository,
            CasePersonRepository casePersonRepository,
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
            FranchiseRecoveryRepository franchiseRecoveryRepository,
            CaseCleasRepository caseCleasRepository,
            CaseThirdPartyRepository caseThirdPartyRepository,
            CaseLegalRepository caseLegalRepository,
            LegalLesionadoRepository legalLesionadoRepository,
            CleasClosurePolicy cleasClosurePolicy,
            CurrentUserService currentUserService,
            CaseAccessControlService caseAccessControlService
    ) {
        this.caseRepository = caseRepository;
        this.caseTypeRepository = caseTypeRepository;
        this.caseIncidentRepository = caseIncidentRepository;
        this.casePersonRepository = casePersonRepository;
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
        this.franchiseRecoveryRepository = franchiseRecoveryRepository;
        this.caseCleasRepository = caseCleasRepository;
        this.caseThirdPartyRepository = caseThirdPartyRepository;
        this.caseLegalRepository = caseLegalRepository;
        this.legalLesionadoRepository = legalLesionadoRepository;
        this.cleasClosurePolicy = cleasClosurePolicy;
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
            boolean gestionTramiteCompleted = tramiteTab.completed();
            tabs.add(tramiteTab);
            CaseReadinessTabResponse budgetTab = buildTodoRiesgoPresupuestoReadiness(caseId, principalVehicle, gestionTramiteCompleted);
            tabs.add(budgetTab);
            tabs.add(buildTodoRiesgoReparacionReadiness(caseId, hasGeneratedBudget(caseId)));
            tabs.add(buildTodoRiesgoPagosReadiness(caseId));
        } else if ("GRANIZO".equals(caseType.getCode())) {
            CaseReadinessTabResponse tramiteTab = buildTodoRiesgoGestionTramiteReadiness(caseId);
            tabs.add(tramiteTab);
            CaseReadinessTabResponse budgetTab = buildGranizoPresupuestoReadiness(
                    caseId, principalVehicle, collectInsuranceRepairBudgetAccessBlockingReasons(caseId));
            tabs.add(budgetTab);
            tabs.add(buildTodoRiesgoReparacionReadiness(caseId, hasGeneratedBudget(caseId)));
            tabs.add(buildInsuranceRepairPagosReadiness(caseId, false));
        } else if ("CLEAS".equals(caseType.getCode())) {
            CaseCleasEntity definition = caseCleasRepository.findByCaseId(caseId).orElse(null);
            if (isFavorableTotalLossCleas(definition) && !cleasClosurePolicy.blocksDownstream(definition)) {
                CaseReadinessTabResponse tramiteTab = buildTodoRiesgoGestionTramiteReadiness(caseId);
                tabs.add(tramiteTab);
                tabs.add(buildTodoRiesgoPresupuestoReadiness(caseId, principalVehicle, tramiteTab.completed()));
                tabs.add(buildTodoRiesgoReparacionReadiness(caseId, hasGeneratedBudget(caseId)));
                tabs.add(buildTodoRiesgoPagosReadiness(caseId));
            } else {
                tabs.add(buildCleasGestionTramiteReadiness(definition));
                tabs.add(buildCleasDownstreamReadiness("PRESUPUESTO", definition));
                tabs.add(buildCleasDownstreamReadiness("GESTION_REPARACION", definition));
                tabs.add(buildCleasDownstreamReadiness("PAGOS", definition));
            }
        } else if ("RECUPERO_FRANQUICIA".equals(caseType.getCode())) {
            FranchiseRecoveryEntity recovery = franchiseRecoveryRepository.findByCaseId(caseId).orElse(null);
            CaseReadinessTabResponse tramiteTab = buildFranchiseRecoveryGestionTramiteReadiness(recovery);
            tabs.add(tramiteTab);
            boolean enablesRepair = recovery != null && Boolean.TRUE.equals(recovery.getEnablesRepair());
            if (enablesRepair) {
                CaseReadinessTabResponse budgetTab = buildTramiteGatedPresupuestoReadiness(caseId, principalVehicle, tramiteTab.completed());
                tabs.add(budgetTab);
                tabs.add(buildTodoRiesgoReparacionReadiness(caseId, hasGeneratedBudget(caseId)));
            }
            tabs.add(buildFranchiseRecoveryPagosReadiness(tramiteTab.completed()));
        } else if (insuranceRepairCasePolicy.isThirdPartyClaim(caseType.getCode())) {
            boolean lawyerManaged = "RECLAMO_TERCEROS_ABOGADO".equals(caseType.getCode());
            CaseLegalEntity legal = caseLegalRepository.findByCaseId(caseId).orElse(null);
            tabs.add(buildTercerosGestionTramiteReadiness(caseId, !lawyerManaged));
            if (lawyerManaged) {
                List<LegalLesionadoEntity> lesionados = legal == null ? List.of() : legalLesionadoRepository.findByCaseLegalIdOrderByIdAsc(legal.getId());
                tabs.add(buildAbogadoReadiness(legal, lesionados));
            }
            // En terceros el presupuesto no queda gateado por la gestion del tramite:
            // la tramitacion toma sus montos desde el presupuesto, no al reves.
            CaseReadinessTabResponse budgetTab = buildBudgetCompletionReadiness(caseId, principalVehicle);
            tabs.add(budgetTab);
            tabs.add(buildTercerosReparacionReadiness(caseId, legal));
            if (lawyerManaged) {
                tabs.add(buildLegalPagosReadiness(legal));
            } else {
                tabs.add(buildInsuranceRepairPagosReadiness(caseId, false));
            }
            // Ficha tecnica de terceros: la titularidad registral del vehiculo es obligatoria
            mergeThirdPartyRegistryOwnershipReasons(tabs, caseId, caseEntity);
        }

        ensureBudgetIsAvailableFromCreation(tabs, caseId, principalVehicle);
        return new CaseReadinessResponse(caseId, caseType.getCode(), tabs);
    }

    /** El presupuesto se puede abrir desde el alta; sus bloqueos sólo impiden avanzar a reparación/pagos. */
    private void ensureBudgetIsAvailableFromCreation(List<CaseReadinessTabResponse> tabs, Long caseId, VehicleEntity principalVehicle) {
        CaseReadinessTabResponse budget = tabs.stream().filter(tab -> "PRESUPUESTO".equals(tab.tabCode())).findFirst().orElse(null);
        if (budget == null) {
            tabs.add(buildBudgetCompletionReadiness(caseId, principalVehicle));
            return;
        }
        int index = tabs.indexOf(budget);
        tabs.set(index, new CaseReadinessTabResponse("PRESUPUESTO", true, budget.completed(), budget.colorHint(), budget.blockingReasons(), budget.warningReasons()));
    }

    private CaseReadinessTabResponse buildCleasGestionTramiteReadiness(CaseCleasEntity definition) {
        List<String> blocking = new ArrayList<>();
        if (definition == null || definition.getScopeCode() == null) blocking.add("Falta indicar el alcance del CLEAS");
        if (definition == null || definition.getOpinionCode() == null) blocking.add("Falta cargar el dictamen CLEAS");
        return toTab("GESTION_TRAMITE", true, blocking, List.of());
    }

    private boolean isFavorableTotalLossCleas(CaseCleasEntity definition) {
        return definition != null
                && "DANIO_TOTAL".equals(definition.getScopeCode())
                && "A_FAVOR".equals(definition.getOpinionCode());
    }

    private CaseReadinessTabResponse buildCleasDownstreamReadiness(String tabCode, CaseCleasEntity definition) {
        if (cleasClosurePolicy.blocksDownstream(definition)) {
            return toTab(tabCode, false, List.of(cleasClosurePolicy.downstreamBlockingReason(definition)), List.of());
        }
        return toTab(tabCode, true, List.of(), List.of());
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
        CaseIncidentEntity incident = caseIncidentRepository.findByCaseId(caseId).orElse(null);

        if (incident == null || incident.getIncidentDate() == null) {
            blocking.add("Falta la fecha del siniestro");
        }
        if (insurance == null || insurance.getInsuranceCompanyId() == null) {
            blocking.add("Falta seleccionar compania de seguro");
        }
        if (processing == null || processing.getPresentedAt() == null) {
            blocking.add("Falta registrar fecha de presentacion del tramite");
        }
        return toTab("GESTION_TRAMITE", true, blocking, List.of());
    }

    private CaseReadinessTabResponse buildTodoRiesgoPresupuestoReadiness(Long caseId, VehicleEntity vehicle, boolean tramiteCompleted) {
        List<String> accessBlocking = collectInsuranceRepairBudgetAccessBlockingReasons(caseId);
        if (!accessBlocking.isEmpty()) {
            return toTab("PRESUPUESTO", false, accessBlocking, List.of());
        }
        return buildTramiteGatedPresupuestoReadiness(caseId, vehicle, tramiteCompleted);
    }

    private CaseReadinessTabResponse buildGranizoPresupuestoReadiness(Long caseId, VehicleEntity vehicle, List<String> budgetAccessBlockingReasons) {
        if (!budgetAccessBlockingReasons.isEmpty()) {
            return toTab("PRESUPUESTO", false, budgetAccessBlockingReasons, List.of());
        }
        return buildBudgetCompletionReadiness(caseId, vehicle);
    }

    private CaseReadinessTabResponse buildTramiteGatedPresupuestoReadiness(Long caseId, VehicleEntity vehicle, boolean tramiteCompleted) {
        List<String> blocking = new ArrayList<>();

        if (!tramiteCompleted) {
            blocking.add("Debe completar Gestion del Tramite antes de cargar el presupuesto");
            return toTab("PRESUPUESTO", false, blocking, List.of());
        }

        return buildBudgetCompletionReadiness(caseId, vehicle);
    }

    private CaseReadinessTabResponse buildBudgetCompletionReadiness(Long caseId, VehicleEntity vehicle) {
        List<String> blocking = new ArrayList<>();

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

    private CaseReadinessTabResponse buildTodoRiesgoReparacionReadiness(Long caseId, boolean budgetGenerated) {
        List<String> blocking = new ArrayList<>();
        InsuranceProcessingEntity processing = insuranceProcessingRepository.findByCaseId(caseId).orElse(null);

        // NO_DEBE_REPARARSE → completada automáticamente
        if (processing != null && Boolean.TRUE.equals(processing.getNoRepair())) {
            return new CaseReadinessTabResponse("GESTION_REPARACION", true, true, "BLUE", List.of(), List.of());
        }

        if (!budgetGenerated) {
            blocking.add("Debe generar el presupuesto antes de gestionar la reparacion");
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
        return buildInsuranceRepairPagosReadiness(caseId, true);
    }

    private CaseReadinessTabResponse buildInsuranceRepairPagosReadiness(Long caseId, boolean includesFranchise) {
        List<String> blocking = new ArrayList<>();
        InsuranceProcessingEntity processing = insuranceProcessingRepository.findByCaseId(caseId).orElse(null);

        if (!isQuotationAgreed(processing)) {
            blocking.add("Falta acordar cotizacion con la Cia. antes de registrar pagos");
            return toTab("PAGOS", false, blocking, List.of());
        }

        CaseFranchiseEntity franchise = includesFranchise ? caseFranchiseRepository.findByCaseId(caseId).orElse(null) : null;
        if (franchise != null && franchise.getFranchiseStatusCode() != null) {
            String franchiseStatus = normalizeCode(franchise.getFranchiseStatusCode());
            if ("PENDIENTE".equals(franchiseStatus)) {
                blocking.add("La franquicia sigue pendiente de resolucion");
            }
        }

        // Verificar que la Cía. haya pagado
        BigDecimal amountToBill = "PROPIA_CIA".equals(normalizeCode(franchise == null ? null : franchise.getRecoveryTypeCode()))
                ? processing.getAgreedAmount()
                : processing.getAgreedAmount().subtract(franchise == null || franchise.getFranchiseAmount() == null ? BigDecimal.ZERO : franchise.getFranchiseAmount()).max(BigDecimal.ZERO);
        if (amountToBill != null && amountToBill.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal ciaPaid = financialMovementRepository.findByCaseId(caseId, Sort.by(Sort.Direction.DESC, "id")).stream()
                    .filter(m -> "ASEGURADORA".equals(normalizeCode(m.getFlowOriginCode())))
                    .map(m -> m.getNetAmount() == null ? BigDecimal.ZERO : m.getNetAmount())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (ciaPaid.compareTo(amountToBill) < 0) {
                blocking.add("La Cia. aun no completo el pago");
            }
        }

        return toTab("PAGOS", true, blocking, List.of());
    }

    // ── RECUPERO_FRANQUICIA ─────────────────────────────────────

    private CaseReadinessTabResponse buildFranchiseRecoveryGestionTramiteReadiness(FranchiseRecoveryEntity recovery) {
        List<String> blocking = new ArrayList<>();
        if (recovery == null || recovery.getManagerCode() == null) {
            blocking.add("Falta indicar quien gestiona el recupero (Taller o Abogado)");
        }
        if (recovery == null || recovery.getOpinionCode() == null) {
            blocking.add("Falta cargar el dictamen del recupero");
        }
        if (recovery == null || recovery.getRecoveryAmount() == null) {
            blocking.add("Falta cargar el monto a recuperar");
        }
        boolean culpaCompartida = recovery != null && "CULPA_COMPARTIDA".equals(normalizeCode(recovery.getOpinionCode()));
        if (recovery != null && recovery.getAgreedAmount() != null && recovery.getRecoveryAmount() != null
                && recovery.getRecoveryAmount().compareTo(recovery.getAgreedAmount()) < 0
                && !culpaCompartida
                && !Boolean.TRUE.equals(recovery.getApprovedLowerAgreement())) {
            blocking.add("El monto a recuperar es inferior al acordado y falta autorizacion del administrador");
        }
        if (culpaCompartida && !Boolean.TRUE.equals(recovery.getRecoversClient())) {
            blocking.add("Con dictamen de culpa compartida debe indicarse la recuperacion a favor del cliente");
        }
        return toTab("GESTION_TRAMITE", true, blocking, List.of());
    }

    private CaseReadinessTabResponse buildFranchiseRecoveryPagosReadiness(boolean tramiteCompleted) {
        List<String> blocking = new ArrayList<>();
        if (!tramiteCompleted) {
            blocking.add("Debe completar Gestion del Tramite antes de registrar pagos");
            return toTab("PAGOS", false, blocking, List.of());
        }
        return toTab("PAGOS", true, blocking, List.of());
    }

    // ── RECLAMO_TERCEROS (taller y abogado) ──────────────────────

    private CaseReadinessTabResponse buildTercerosGestionTramiteReadiness(Long caseId, boolean requiresPresentacion) {
        List<String> blocking = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        CaseIncidentEntity incident = caseIncidentRepository.findByCaseId(caseId).orElse(null);
        CaseThirdPartyEntity thirdParty = caseThirdPartyRepository.findByCaseId(caseId).orElse(null);

        if (incident == null || incident.getIncidentDate() == null) {
            blocking.add("Falta la fecha del siniestro");
        }
        if (thirdParty == null || thirdParty.getThirdPartyCompanyId() == null) {
            blocking.add("Falta seleccionar la compania de la contraparte");
        }
        if (requiresPresentacion) {
            InsuranceProcessingEntity processing = insuranceProcessingRepository.findByCaseId(caseId).orElse(null);
            if (processing == null || processing.getPresentedAt() == null) {
                blocking.add("Falta registrar fecha de presentacion del tramite");
            }
        }
        if (thirdParty == null || !"ACEPTADA".equals(normalizeCode(thirdParty.getDocumentationStatusCode()))) {
            warnings.add("Carpeta con documentacion pendiente");
        }
        return new CaseReadinessTabResponse(
                "GESTION_TRAMITE",
                true,
                blocking.isEmpty(),
                blocking.isEmpty() ? "BLUE" : "RED",
                List.copyOf(blocking),
                List.copyOf(warnings)
        );
    }

    private CaseReadinessTabResponse buildTercerosReparacionReadiness(Long caseId, CaseLegalEntity legal) {
        // "No repara vehiculo" anula la gestion de reparacion: la solapa queda completa en azul.
        if (legal != null && Boolean.FALSE.equals(legal.getRepairsVehicle())) {
            return new CaseReadinessTabResponse("GESTION_REPARACION", true, true, "BLUE", List.of(), List.of());
        }
        return buildTodoRiesgoReparacionReadiness(caseId, hasGeneratedBudget(caseId));
    }

    /**
     * Reclamo de terceros (taller y abogado): la ficha tecnica exige declarar la titularidad
     * registral del vehiculo principal (cliente titular o titulares con porcentaje al 100%).
     * Se agrega sobre la ficha tecnica comun sin modificar la regla de los demas tramites.
     */
    private void mergeThirdPartyRegistryOwnershipReasons(List<CaseReadinessTabResponse> tabs, Long caseId, CaseEntity caseEntity) {
        List<String> ownershipReasons = collectRegistryOwnershipBlockingReasons(caseId, caseEntity);
        if (ownershipReasons.isEmpty()) {
            return;
        }
        CaseReadinessTabResponse ficha = tabs.get(0);
        List<String> merged = new ArrayList<>(ficha.blockingReasons());
        merged.addAll(ownershipReasons);
        tabs.set(0, new CaseReadinessTabResponse(ficha.tabCode(), ficha.allowed(), false, "RED", List.copyOf(merged), ficha.warningReasons()));
    }

    private List<String> collectRegistryOwnershipBlockingReasons(Long caseId, CaseEntity caseEntity) {
        List<String> reasons = new ArrayList<>();
        if (caseEntity.getPrincipalVehicleId() == null) {
            // Ya bloqueado por la ficha tecnica comun (falta vehiculo principal)
            return reasons;
        }
        List<CasePersonEntity> titulares = casePersonRepository.findByCaseIdAndCaseRoleCodeOrderByIdAsc(caseId, "TITULAR").stream()
                .filter(titular -> caseEntity.getPrincipalVehicleId().equals(titular.getVehicleId()))
                .toList();
        if (titulares.isEmpty()) {
            reasons.add("Falta indicar al titular registral del vehiculo");
            return reasons;
        }
        int registered = titulares.stream()
                .map(titular -> titular.getRegistryOwnershipPercentage() == null ? 0 : titular.getRegistryOwnershipPercentage())
                .reduce(0, Integer::sum);
        if (registered < 100) {
            reasons.add("La titularidad registral del vehiculo suma menos del 100%");
        }
        return reasons;
    }

    private CaseReadinessTabResponse buildAbogadoReadiness(CaseLegalEntity legal, List<LegalLesionadoEntity> lesionados) {
        if (legal == null) {
            return new CaseReadinessTabResponse("ABOGADO", true, false, "RED", List.of("Falta cargar la gestion del abogado"), List.of());
        }
        List<String> blocking = new ArrayList<>();
        if (legal.getEntryDate() == null) {
            blocking.add("Falta registrar la fecha de ingreso del expediente");
        }
        if (legal.getProcessorCode() == null) {
            blocking.add("Falta indicar con que instrumento tramita el abogado");
        }
        if (legal.getClaimantCode() == null) {
            blocking.add("Falta indicar que se reclama");
        } else if (CLAIMS_WITH_INJURIES.contains(normalizeCode(legal.getClaimantCode())) && lesionados.isEmpty()) {
            blocking.add("Falta cargar los datos del lesionado");
        }
        if (legal.getInstanceCode() == null) {
            blocking.add("Falta seleccionar la instancia");
        } else if ("JUDICIAL".equals(normalizeCode(legal.getInstanceCode()))) {
            // Solo la instancia judicial exige CUIJ/juzgado/autos; en administrativa no aplican.
            if (isBlank(legal.getCuij())) blocking.add("Falta el CUIJ");
            if (isBlank(legal.getCourt())) blocking.add("Falta el juzgado");
            if (isBlank(legal.getCaseNumber())) blocking.add("Falta la caratula (autos)");
        }
        return new CaseReadinessTabResponse(
                "ABOGADO",
                true,
                blocking.isEmpty(),
                blocking.isEmpty() ? "BLUE" : "RED",
                List.copyOf(blocking),
                List.of()
        );
    }

    private CaseReadinessTabResponse buildLegalPagosReadiness(CaseLegalEntity legal) {
        if (legal == null) {
            return new CaseReadinessTabResponse("PAGOS", true, false, "RED", List.of("Falta cargar la gestion del abogado"), List.of());
        }
        List<String> blocking = new ArrayList<>();
        if (legal.getTotalProceedsAmount() == null) {
            blocking.add("Falta registrar el importe total del expediente");
        }
        if (legal.getClosedByCode() == null) {
            blocking.add("Falta registrar el cierre del expediente");
        } else if (legal.getLegalCloseDate() == null) {
            blocking.add("Falta la fecha de cierre del expediente");
        }
        return new CaseReadinessTabResponse(
                "PAGOS",
                true,
                blocking.isEmpty(),
                blocking.isEmpty() ? "BLUE" : "RED",
                List.copyOf(blocking),
                List.of()
        );
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
                && caseEntity.getReferenciadorId() == null
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

    private List<String> collectInsuranceRepairBudgetAccessBlockingReasons(Long caseId) {
        List<String> reasons = new ArrayList<>();
        CaseInsuranceEntity insurance = caseInsuranceRepository.findByCaseId(caseId).orElse(null);
        CaseIncidentEntity incident = caseIncidentRepository.findByCaseId(caseId).orElse(null);
        if (insurance == null || insurance.getInsuranceCompanyId() == null) reasons.add("Falta seleccionar compania de seguro");
        if (insurance == null || isBlank(insurance.getClaimNumber())) reasons.add("Falta numero de siniestro");
        if (insurance == null || insurance.getProcessorCasePersonId() == null) reasons.add("Falta seleccionar tramitador/a");
        if (insurance == null || insurance.getInspectorCasePersonId() == null) reasons.add("Falta seleccionar inspector/a");
        if (insurance == null || isBlank(insurance.getCoverageDetail())) reasons.add("Falta detalle de cobertura");
        if (incident == null || incident.getIncidentDate() == null) reasons.add("Falta la fecha del siniestro");
        return reasons;
    }

    private boolean isQuotationAgreed(InsuranceProcessingEntity processing) {
        return processing != null
                && "ACEPTADA".equals(normalizeCode(processing.getQuotationStatusCode()))
                && processing.getAgreedAmount() != null
                && processing.getQuotationDate() != null;
    }

    private boolean hasGeneratedBudget(Long caseId) {
        return budgetRepository.findByCaseId(caseId).isPresent();
    }

    private BigDecimal scale(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.setScale(2, java.math.RoundingMode.HALF_UP);
    }

}
