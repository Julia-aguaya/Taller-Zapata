package com.tallerzapata.backend.application.casefile;

import com.tallerzapata.backend.api.casefile.CaseCreateRequest;
import com.tallerzapata.backend.application.casefile.particular.ParticularEffectiveStateRecalculator;
import com.tallerzapata.backend.application.casefile.todoriskstate.TodoRiesgoEffectiveStateRecalculator;
import com.tallerzapata.backend.api.casefile.CaseCatalogsResponse;
import com.tallerzapata.backend.api.casefile.CasePageResponse;
import com.tallerzapata.backend.api.casefile.CaseVisibleStateResponse;
import com.tallerzapata.backend.api.casefile.CaseTypeCatalogResponse;
import com.tallerzapata.backend.api.casefile.CaseRelationCreateRequest;
import com.tallerzapata.backend.api.casefile.CaseRelationResponse;
import com.tallerzapata.backend.api.casefile.CaseResponse;
import com.tallerzapata.backend.api.casefile.CaseUpdateRequest;
import com.tallerzapata.backend.api.casefile.CodeCatalogResponse;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseIncidentEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseIncidentRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CasePriorityRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CasePersonEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CasePersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRelationEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRelationRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRoleRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseVehicleEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseVehicleRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementEntity;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseLegalRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.InsuranceProcessingRepository;
import com.tallerzapata.backend.infrastructure.persistence.organization.BranchEntity;
import com.tallerzapata.backend.infrastructure.persistence.organization.BranchRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.OperationalTaskEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.OperationalTaskRepository;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonEntity;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.recovery.FranchiseRecoveryRepository;
import com.tallerzapata.backend.infrastructure.persistence.security.UserEntity;
import com.tallerzapata.backend.infrastructure.persistence.security.UserRepository;
import com.tallerzapata.backend.infrastructure.persistence.security.UserRoleEntity;
import com.tallerzapata.backend.infrastructure.persistence.security.UserRoleRepository;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleEntity;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleRepository;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleRoleRepository;
import com.tallerzapata.backend.infrastructure.persistence.workflow.CaseStateHistoryEntity;
import com.tallerzapata.backend.infrastructure.persistence.workflow.CaseStateHistoryRepository;
import com.tallerzapata.backend.infrastructure.persistence.workflow.WorkflowStateEntity;
import com.tallerzapata.backend.infrastructure.persistence.workflow.WorkflowStateRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CaseService {

    private final CaseRepository caseRepository;
    private final CaseTypeRepository caseTypeRepository;
    private final BranchRepository branchRepository;
    private final PersonRepository personRepository;
    private final VehicleRepository vehicleRepository;
    private final WorkflowStateRepository workflowStateRepository;
    private final CasePersonRepository casePersonRepository;
    private final CaseVehicleRepository caseVehicleRepository;
    private final CaseIncidentRepository caseIncidentRepository;
    private final CaseStateHistoryRepository caseStateHistoryRepository;
    private final CaseAuditService caseAuditService;
    private final CaseRelationRepository caseRelationRepository;
    private final CaseRoleRepository caseRoleRepository;
    private final CasePriorityRepository casePriorityRepository;
    private final VehicleRoleRepository vehicleRoleRepository;
    private final FinancialMovementRepository financialMovementRepository;
    private final InsuranceProcessingRepository insuranceProcessingRepository;
    private final FranchiseRecoveryRepository franchiseRecoveryRepository;
    private final CaseLegalRepository caseLegalRepository;
    private final OperationalTaskRepository operationalTaskRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService caseAccessControlService;
    private final CaseVisibleStateResolver caseVisibleStateResolver;
    private final ParticularEffectiveStateRecalculator particularEffectiveStateRecalculator;
    private final TodoRiesgoEffectiveStateRecalculator todoRiesgoEffectiveStateRecalculator;

    public CaseService(
            CaseRepository caseRepository,
            CaseTypeRepository caseTypeRepository,
            BranchRepository branchRepository,
            PersonRepository personRepository,
            VehicleRepository vehicleRepository,
            WorkflowStateRepository workflowStateRepository,
            CasePersonRepository casePersonRepository,
            CaseVehicleRepository caseVehicleRepository,
            CaseIncidentRepository caseIncidentRepository,
            CaseStateHistoryRepository caseStateHistoryRepository,
            CaseAuditService caseAuditService,
            CaseRelationRepository caseRelationRepository,
            CaseRoleRepository caseRoleRepository,
            CasePriorityRepository casePriorityRepository,
            VehicleRoleRepository vehicleRoleRepository,
            FinancialMovementRepository financialMovementRepository,
            InsuranceProcessingRepository insuranceProcessingRepository,
            FranchiseRecoveryRepository franchiseRecoveryRepository,
            CaseLegalRepository caseLegalRepository,
            OperationalTaskRepository operationalTaskRepository,
            UserRoleRepository userRoleRepository,
            UserRepository userRepository,
            CurrentUserService currentUserService,
            CaseAccessControlService caseAccessControlService,
            CaseVisibleStateResolver caseVisibleStateResolver, ParticularEffectiveStateRecalculator particularEffectiveStateRecalculator,
            TodoRiesgoEffectiveStateRecalculator todoRiesgoEffectiveStateRecalculator
    ) {
        this.caseRepository = caseRepository;
        this.caseTypeRepository = caseTypeRepository;
        this.branchRepository = branchRepository;
        this.personRepository = personRepository;
        this.vehicleRepository = vehicleRepository;
        this.workflowStateRepository = workflowStateRepository;
        this.casePersonRepository = casePersonRepository;
        this.caseVehicleRepository = caseVehicleRepository;
        this.caseIncidentRepository = caseIncidentRepository;
        this.caseStateHistoryRepository = caseStateHistoryRepository;
        this.caseAuditService = caseAuditService;
        this.caseRelationRepository = caseRelationRepository;
        this.caseRoleRepository = caseRoleRepository;
        this.casePriorityRepository = casePriorityRepository;
        this.vehicleRoleRepository = vehicleRoleRepository;
        this.financialMovementRepository = financialMovementRepository;
        this.insuranceProcessingRepository = insuranceProcessingRepository;
        this.franchiseRecoveryRepository = franchiseRecoveryRepository;
        this.caseLegalRepository = caseLegalRepository;
        this.operationalTaskRepository = operationalTaskRepository;
        this.userRoleRepository = userRoleRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.caseAccessControlService = caseAccessControlService;
        this.caseVisibleStateResolver = caseVisibleStateResolver;
        this.particularEffectiveStateRecalculator = particularEffectiveStateRecalculator;
        this.todoRiesgoEffectiveStateRecalculator = todoRiesgoEffectiveStateRecalculator;
    }

    @Transactional(readOnly = true)
    public CaseCatalogsResponse listCatalogs() {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        caseAccessControlService.requirePermission(currentUser, "caso.ver");

        List<CaseTypeCatalogResponse> caseTypes = caseTypeRepository.findByActiveTrueOrderByVisualOrderAscNameAsc().stream()
                .map(item -> new CaseTypeCatalogResponse(
                        item.getId(),
                        item.getCode(),
                        item.getName(),
                        item.getFolderPrefix(),
                        item.getVisualOrder(),
                        item.getRequiresProcessing(),
                        item.getRequiresLawyer()
                ))
                .toList();

        List<CodeCatalogResponse> customerRoles = caseRoleRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(item -> new CodeCatalogResponse(item.getCode(), item.getName()))
                .toList();

        List<CodeCatalogResponse> vehicleRoles = vehicleRoleRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(item -> new CodeCatalogResponse(item.getCode(), item.getName()))
                .toList();

        List<CodeCatalogResponse> priorities = casePriorityRepository.findByActiveTrueOrderByVisualOrderAscNameAsc().stream()
                .map(item -> new CodeCatalogResponse(item.getCode(), item.getName()))
                .toList();

        return new CaseCatalogsResponse(
                caseTypes,
                customerRoles,
                vehicleRoles,
                priorities,
                List.of("tramite", "reparacion", "pago", "documentacion", "legal")
        );
    }

    @Transactional(readOnly = true)
    public CasePageResponse list(int page, int size, Long organizationId, Long branchId, CaseListFilters filters) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        caseAccessControlService.requirePermission(currentUser, "caso.ver");
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 100);
        List<OperationalTaskEntity> pendingTasks = shouldEvaluatePendingTasks(filters)
                ? operationalTaskRepository.findAll(Sort.by(Sort.Direction.DESC, "id")).stream()
                .filter(task -> !Boolean.TRUE.equals(task.getResolved()))
                .toList()
                : List.of();
        List<FinancialMovementEntity> financialMovements = shouldEvaluatePaidDate(filters)
                ? financialMovementRepository.findAll(Sort.by(Sort.Direction.DESC, "movementAt").and(Sort.by(Sort.Direction.DESC, "id")))
                : List.of();

        boolean hasTextSearch = filters != null && filters.q() != null && !filters.q().isBlank();
        List<CaseEntity> allCases;
        if (hasTextSearch) {
            String normalizedQuery = filters.q().trim().toLowerCase(Locale.ROOT);
            allCases = caseRepository.searchAutocomplete(
                    normalizedQuery,
                    normalizedQuery,
                    PageRequest.of(0, 500)
            );
        } else {
            allCases = caseRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
        }

        Map<Long, PersonEntity> personsById;
        Map<Long, VehicleEntity> vehiclesById;
        if (!allCases.isEmpty()) {
            List<Long> personIds = allCases.stream()
                    .map(CaseEntity::getPrincipalCustomerPersonId)
                    .filter(id -> id != null)
                    .distinct()
                    .toList();
            personsById = personIds.isEmpty() ? Map.of() :
                    personRepository.findAllById(personIds).stream()
                            .collect(Collectors.toMap(PersonEntity::getId, p -> p));
            List<Long> vehicleIds = allCases.stream()
                    .map(CaseEntity::getPrincipalVehicleId)
                    .filter(id -> id != null)
                    .distinct()
                    .toList();
            vehiclesById = vehicleIds.isEmpty() ? Map.of() :
                    vehicleRepository.findAllById(vehicleIds).stream()
                            .collect(Collectors.toMap(VehicleEntity::getId, v -> v));
        } else {
            personsById = Map.of();
            vehiclesById = Map.of();
        }

        List<CaseResponse> scopedItems = allCases.stream()
                .filter(item -> hasScope(currentUser, item))
                .filter(item -> organizationId == null || item.getOrganizationId().equals(organizationId))
                .filter(item -> branchId == null || item.getBranchId().equals(branchId))
                .map(item -> new CaseListItem(item, toResponse(item, personsById, vehiclesById)))
                .filter(item -> matchesFilters(item, filters, pendingTasks, financialMovements))
                .map(CaseListItem::response)
                .toList();

        long totalElements = scopedItems.size();
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / normalizedSize);
        int fromIndex = normalizedPage * normalizedSize;
        List<CaseResponse> pageItems = fromIndex >= scopedItems.size()
                ? List.of()
                : scopedItems.subList(fromIndex, Math.min(fromIndex + normalizedSize, scopedItems.size()));

        return new CasePageResponse(pageItems, normalizedPage, normalizedSize, totalElements, totalPages);
    }

    @Transactional(readOnly = true)
    public CaseResponse getById(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity entity = getCase(caseId);
        caseAccessControlService.requireCaseAccess(currentUser, entity, "caso.ver");
        return toResponse(entity);
    }

    @Transactional
    public CaseResponse create(CaseCreateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        caseAccessControlService.requirePermission(currentUser, "caso.crear");
        CreationScope creationScope = resolveCreationScope(currentUser, request.organizationId(), request.branchId());
        caseAccessControlService.requireOrganizationScope(currentUser, creationScope.organizationId(), creationScope.branchId());

        CaseTypeEntity caseType = caseTypeRepository.findById(request.caseTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe el tipo de tramite " + request.caseTypeId()));
        BranchEntity branch = branchRepository.findById(creationScope.branchId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe la sucursal " + creationScope.branchId()));

        if (!branch.getOrganizationId().equals(creationScope.organizationId())) {
            throw new ResourceNotFoundException("La sucursal no pertenece a la organizacion indicada");
        }

        personRepository.findById(request.principalCustomerPersonId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe la persona principal " + request.principalCustomerPersonId()));
        vehicleRepository.findById(request.principalVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe el vehiculo principal " + request.principalVehicleId()));

        String customerRoleCode = request.customerRoleCode() == null || request.customerRoleCode().isBlank()
                ? "CLIENTE"
                : request.customerRoleCode();
        String principalVehicleRoleCode = request.principalVehicleRoleCode() == null || request.principalVehicleRoleCode().isBlank()
                ? "PRINCIPAL"
                : request.principalVehicleRoleCode();

        validateCaseCodes(customerRoleCode, principalVehicleRoleCode, request.priorityCode());

        WorkflowStateEntity initialCaseState = workflowStateRepository.findByDomainAndCode("tramite", "INGRESADO")
                .orElseThrow(() -> new ResourceNotFoundException("No existe el estado inicial de tramite"));
        WorkflowStateEntity initialRepairState = workflowStateRepository.findByDomainAndCode("reparacion", "SIN_TURNO")
                .orElseThrow(() -> new ResourceNotFoundException("No existe el estado inicial de reparacion"));
        WorkflowStateEntity initialPaymentState = workflowStateRepository.findByDomainAndCode("pago", "PENDIENTE")
                .orElseThrow(() -> new ResourceNotFoundException("No existe el estado inicial de pago"));
        WorkflowStateEntity initialDocumentationState = workflowStateRepository.findByDomainAndCode("documentacion", "PENDIENTE_DOCS")
                .orElseThrow(() -> new ResourceNotFoundException("No existe el estado inicial de documentacion"));
        WorkflowStateEntity initialLegalState = workflowStateRepository.findByDomainAndCode("legal", "SIN_GESTION")
                .orElseThrow(() -> new ResourceNotFoundException("No existe el estado inicial de legal"));

        Long nextOrderNumber = caseRepository.findMaxOrderNumberByOrganizationId(creationScope.organizationId()) + 1;
        String folderCode = CaseFolderCodeGenerator.generate(nextOrderNumber, caseType.getFolderPrefix(), branch.getCode());

        CaseEntity entity = new CaseEntity();
        entity.setOrderNumber(nextOrderNumber);
        entity.setFolderCode(folderCode);
        entity.setCaseTypeId(caseType.getId());
        entity.setOrganizationId(creationScope.organizationId());
        entity.setBranchId(creationScope.branchId());
        entity.setPrincipalVehicleId(request.principalVehicleId());
        entity.setPrincipalCustomerPersonId(request.principalCustomerPersonId());
        entity.setReferenced(Boolean.TRUE.equals(request.referenced()));
        entity.setReferredByPersonId(request.referredByPersonId());
        entity.setReferenciadorId(request.referenciadorId());
        entity.setReferredByText(blankToNull(request.referredByText()));
        entity.setCreatedByUserId(currentUser.id());
        entity.setCurrentCaseStateId(initialCaseState.getId());
        entity.setCurrentRepairStateId(initialRepairState.getId());
        entity.setCurrentPaymentStateId(initialPaymentState.getId());
        entity.setCurrentDocumentationStateId(initialDocumentationState.getId());
        entity.setCurrentLegalStateId(initialLegalState.getId());
        entity.setPriorityCode(blankToNull(request.priorityCode()));
        entity.setGeneralObservations(blankToNull(request.generalObservations()));
        entity = caseRepository.save(entity);

        CasePersonEntity casePerson = new CasePersonEntity();
        casePerson.setCaseId(entity.getId());
        casePerson.setPersonId(request.principalCustomerPersonId());
        casePerson.setCaseRoleCode(normalizeCode(customerRoleCode));
        casePerson.setVehicleId(request.principalVehicleId());
        casePerson.setPrincipal(true);
        casePersonRepository.save(casePerson);

        CaseVehicleEntity caseVehicle = new CaseVehicleEntity();
        caseVehicle.setCaseId(entity.getId());
        caseVehicle.setVehicleId(request.principalVehicleId());
        caseVehicle.setVehicleRoleCode(normalizeCode(principalVehicleRoleCode));
        caseVehicle.setPrincipal(true);
        caseVehicle.setVisualOrder(1);
        caseVehicleRepository.save(caseVehicle);

        if (request.incidentDate() != null || request.incidentTime() != null || request.incidentPlace() != null || request.incidentDynamics() != null || request.incidentObservations() != null || request.prescriptionDate() != null || request.daysInProcess() != null) {
            CaseIncidentEntity incidentEntity = new CaseIncidentEntity();
            incidentEntity.setCaseId(entity.getId());
            incidentEntity.setIncidentDate(request.incidentDate());
            incidentEntity.setIncidentTime(request.incidentTime());
            incidentEntity.setLugar(blankToNull(request.incidentPlace()));
            incidentEntity.setDinamica(blankToNull(request.incidentDynamics()));
            incidentEntity.setObservaciones(blankToNull(request.incidentObservations()));
            incidentEntity.setPrescriptionDate(request.prescriptionDate());
            incidentEntity.setDaysInProcess(request.daysInProcess());
            caseIncidentRepository.save(incidentEntity);
        }

        caseStateHistoryRepository.save(history(entity.getId(), "tramite", initialCaseState.getId(), currentUser.id(), false, "Creacion inicial del caso"));
        caseStateHistoryRepository.save(history(entity.getId(), "reparacion", initialRepairState.getId(), currentUser.id(), true, "Estado inicial de reparacion"));
        caseStateHistoryRepository.save(history(entity.getId(), "pago", initialPaymentState.getId(), currentUser.id(), true, "Estado inicial de pago"));
        caseStateHistoryRepository.save(history(entity.getId(), "documentacion", initialDocumentationState.getId(), currentUser.id(), true, "Estado inicial de documentacion"));
        caseStateHistoryRepository.save(history(entity.getId(), "legal", initialLegalState.getId(), currentUser.id(), true, "Estado inicial legal"));

        Map<String, Object> after = new LinkedHashMap<>();
        after.put("folderCode", folderCode);
        after.put("orderNumber", nextOrderNumber);
        after.put("organizationId", entity.getOrganizationId());
        after.put("branchId", entity.getBranchId());
        after.put("principalVehicleId", entity.getPrincipalVehicleId());
        after.put("principalCustomerPersonId", entity.getPrincipalCustomerPersonId());
        after.put("stateCache", Map.of(
                "tramite", initialCaseState.getCode(),
                "reparacion", initialRepairState.getCode(),
                "pago", initialPaymentState.getCode(),
                "documentacion", initialDocumentationState.getCode(),
                "legal", initialLegalState.getCode()
        ));

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("caseTypeCode", caseType.getCode());
        metadata.put("customerRoleCode", customerRoleCode);
        metadata.put("principalVehicleRoleCode", principalVehicleRoleCode);
        metadata.put("creationScopeResolved", Map.of(
                "organizationId", creationScope.organizationId(),
                "branchId", creationScope.branchId()
        ));

        caseAuditService.register(
                currentUser.id(),
                entity.getId(),
                "casos",
                entity.getId(),
                "crear",
                null,
                caseAuditService.toJson(after),
                caseAuditService.toJson(metadata),
                httpRequest
        );
        particularEffectiveStateRecalculator.recalculate(entity.getId());
        todoRiesgoEffectiveStateRecalculator.recalculate(entity.getId());

        return toResponse(entity);
    }

    @Transactional
    public CaseResponse update(Long caseId, CaseUpdateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity entity = getCase(caseId);
        caseAccessControlService.requireCaseAccess(currentUser, entity, "caso.crear");
        Long caseTypeId = entity.getCaseTypeId();
        CaseTypeEntity caseType = caseTypeRepository.findById(caseTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el tipo de tramite " + caseTypeId));

        if ("PARTICULAR".equals(normalizeCode(caseType.getCode())) && request.closedAt() != null) {
            throw new ConflictException("closedAt se calcula automaticamente para tramites PARTICULARES");
        }

        if (request.referredByPersonId() != null) {
            personRepository.findById(request.referredByPersonId())
                    .orElseThrow(() -> new ResourceNotFoundException("No existe la persona referida " + request.referredByPersonId()));
        }

        Map<String, Object> before = new LinkedHashMap<>();
        before.put("referenced", entity.getReferenced());
        before.put("referredByPersonId", entity.getReferredByPersonId());
        before.put("referenciadorId", entity.getReferenciadorId());
        before.put("referredByText", entity.getReferredByText());
        before.put("priorityCode", entity.getPriorityCode());
        before.put("generalObservations", entity.getGeneralObservations());
        before.put("closedAt", entity.getClosedAt());
        before.put("archivedAt", entity.getArchivedAt());

        if (request.referenced() != null) {
            entity.setReferenced(request.referenced());
            if (!request.referenced()) {
                entity.setReferredByPersonId(null);
                entity.setReferenciadorId(null);
                entity.setReferredByText(null);
            } else {
                entity.setReferredByPersonId(request.referredByPersonId());
                if (request.referenciadorId() != null) {
                    entity.setReferenciadorId(request.referenciadorId());
                }
                entity.setReferredByText(blankToNull(request.referredByText()));
            }
        } else {
            entity.setReferredByPersonId(request.referredByPersonId());
            entity.setReferredByText(blankToNull(request.referredByText()));
        }
        entity.setPriorityCode(normalizeCode(request.priorityCode()));

        if (entity.getPriorityCode() != null && !casePriorityRepository.existsByCodeAndActiveTrue(entity.getPriorityCode())) {
            throw new ConflictException("priorityCode no permitido: " + entity.getPriorityCode());
        }
        entity.setGeneralObservations(blankToNull(request.generalObservations()));
        if (request.closedAt() != null) {
            entity.setClosedAt(request.closedAt());
        }
        if (request.archivedAt() != null) {
            entity.setArchivedAt(request.archivedAt());
        }

        entity = caseRepository.save(entity);

        Map<String, Object> after = new LinkedHashMap<>();
        after.put("referenced", entity.getReferenced());
        after.put("referredByPersonId", entity.getReferredByPersonId());
        after.put("referenciadorId", entity.getReferenciadorId());
        after.put("referredByText", entity.getReferredByText());
        after.put("priorityCode", entity.getPriorityCode());
        after.put("generalObservations", entity.getGeneralObservations());
        after.put("closedAt", entity.getClosedAt());
        after.put("archivedAt", entity.getArchivedAt());

        caseAuditService.register(
                currentUser.id(),
                entity.getId(),
                "casos",
                entity.getId(),
                "actualizar",
                caseAuditService.toJson(before),
                caseAuditService.toJson(after),
                null,
                httpRequest
        );

        return toResponse(entity);
    }

    @Transactional(readOnly = true)
    public List<CaseRelationResponse> listRelations(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = getCase(caseId);
        caseAccessControlService.requireCaseAccess(currentUser, caseEntity, "caso.ver");
        return caseRelationRepository.findBySourceCaseIdOrderByIdDesc(caseId)
                .stream()
                .map(this::toRelationResponse)
                .toList();
    }

    @Transactional
    public CaseRelationResponse createRelation(Long caseId, CaseRelationCreateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity sourceCase = getCase(caseId);
        caseAccessControlService.requireCaseAccess(currentUser, sourceCase, "caso.crear");
        CaseEntity targetCase = getCase(request.targetCaseId());
        caseAccessControlService.requireCaseAccess(currentUser, targetCase, "caso.ver");

        if (caseId.equals(request.targetCaseId())) {
            throw new ConflictException("Un caso no puede relacionarse consigo mismo");
        }

        caseRelationRepository.findBySourceCaseIdAndTargetCaseIdAndRelationTypeCode(caseId, request.targetCaseId(), request.relationTypeCode())
                .ifPresent(existing -> {
                    throw new ConflictException("La relacion entre casos ya existe");
                });

        CaseRelationEntity entity = new CaseRelationEntity();
        entity.setSourceCaseId(caseId);
        entity.setTargetCaseId(request.targetCaseId());
        entity.setRelationTypeCode(request.relationTypeCode().trim());
        entity.setDescription(blankToNull(request.description()));
        entity = caseRelationRepository.save(entity);

        Map<String, Object> relationAfter = new LinkedHashMap<>();
        relationAfter.put("targetCaseId", request.targetCaseId());
        relationAfter.put("relationTypeCode", request.relationTypeCode().trim());
        relationAfter.put("description", entity.getDescription());

        caseAuditService.register(
                currentUser.id(),
                sourceCase.getId(),
                "caso_relaciones",
                entity.getId(),
                "crear_relacion",
                null,
                caseAuditService.toJson(relationAfter),
                null,
                httpRequest
        );

        return toRelationResponse(entity);
    }

    private CaseStateHistoryEntity history(Long caseId, String domain, Long stateId, Long userId, boolean automatic, String reason) {
        CaseStateHistoryEntity historyEntity = new CaseStateHistoryEntity();
        historyEntity.setCaseId(caseId);
        historyEntity.setStateDomain(domain);
        historyEntity.setStateId(stateId);
        historyEntity.setStateDate(LocalDateTime.now());
        historyEntity.setUserId(userId);
        historyEntity.setAutomatic(automatic);
        historyEntity.setMotivo(reason);
        return historyEntity;
    }

    private CaseEntity getCase(Long caseId) {
        return caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
    }

    private boolean matchesFilters(CaseListItem item, CaseListFilters filters, List<OperationalTaskEntity> pendingTasks, List<FinancialMovementEntity> financialMovements) {
        if (filters == null) {
            return true;
        }

        return matchesFolderStatus(item.response(), filters.folderStatus())
                && matchesOpenedAt(item.entity(), filters.openedFrom(), filters.openedTo())
                && matchesPaidAt(item.response(), item.entity(), filters.paidFrom(), filters.paidTo(), financialMovements)
                && matchesCaseType(item.response(), filters.caseTypeCode())
                && matchesOpinion(item.entity(), filters.opinionCode())
                && matchesManager(item.entity(), filters.managerCode())
                && matchesVisibleState(item.response().visibleTramiteState(), filters.visibleTramiteState())
                && matchesVisibleState(item.response().visibleRepairState(), filters.visibleRepairState())
                && matchesPaymentState(item.response(), filters.paymentStateCode())
                && matchesPendingTasks(item.entity(), filters, pendingTasks);
    }

    private boolean matchesFolderStatus(CaseResponse response, String filterValue) {
        if (filterValue == null || filterValue.isBlank()) {
            return true;
        }

        String normalized = normalizeText(filterValue);
        return switch (normalized) {
            case "ABIERTA", "ABIERTAS", "OPEN", "OPENED" -> response.closedAt() == null && response.archivedAt() == null;
            case "CERRADA", "CERRADAS", "CLOSED" -> response.closedAt() != null && response.archivedAt() == null;
            case "ARCHIVADA", "ARCHIVADAS", "ARCHIVED" -> response.archivedAt() != null;
            default -> throw new ConflictException("folderStatus no soportado: " + filterValue);
        };
    }

    private boolean matchesOpenedAt(CaseEntity entity, LocalDate openedFrom, LocalDate openedTo) {
        if (openedFrom == null && openedTo == null) {
            return true;
        }

        LocalDate openedAt = resolveOpenedAt(entity.getId());
        if (openedAt == null) {
            return false;
        }

        if (openedFrom != null && openedAt.isBefore(openedFrom)) {
            return false;
        }

        return openedTo == null || !openedAt.isAfter(openedTo);
    }

    private boolean matchesPaidAt(CaseResponse response, CaseEntity entity, LocalDate paidFrom, LocalDate paidTo, List<FinancialMovementEntity> financialMovements) {
        if (paidFrom == null && paidTo == null) {
            return true;
        }

        if (!"PAGADO".equals(normalizeText(response.currentPaymentStateCode()))) {
            return false;
        }

        LocalDate paidAt = resolvePaidAt(entity.getId(), financialMovements);
        if (paidAt == null) {
            return false;
        }

        if (paidFrom != null && paidAt.isBefore(paidFrom)) {
            return false;
        }

        return paidTo == null || !paidAt.isAfter(paidTo);
    }

    private LocalDate resolvePaidAt(Long caseId, List<FinancialMovementEntity> financialMovements) {
        return financialMovements.stream()
                .filter(movement -> caseId.equals(movement.getCaseId()))
                .map(movement -> movement.getMovementAt().toLocalDate())
                .findFirst()
                .orElse(null);
    }

    private LocalDate resolveOpenedAt(Long caseId) {
        List<CaseStateHistoryEntity> history = caseStateHistoryRepository.findByCaseIdOrderByStateDateDescIdDesc(caseId);
        if (history.isEmpty()) {
            return null;
        }
        return history.get(history.size() - 1).getStateDate().toLocalDate();
    }

    private boolean matchesCaseType(CaseResponse response, String caseTypeCode) {
        if (caseTypeCode == null || caseTypeCode.isBlank()) {
            return true;
        }
        return normalizeText(response.caseTypeCode()).equals(normalizeText(caseTypeCode));
    }

    private boolean matchesOpinion(CaseEntity entity, String opinionCode) {
        if (opinionCode == null || opinionCode.isBlank()) {
            return true;
        }

        return normalizeText(resolveOpinionCode(entity.getId())).equals(normalizeText(opinionCode));
    }

    private String resolveOpinionCode(Long caseId) {
        String insuranceOpinion = insuranceProcessingRepository.findByCaseId(caseId)
                .map(item -> item.getOpinionCode())
                .orElse(null);
        if (insuranceOpinion != null && !insuranceOpinion.isBlank()) {
            return insuranceOpinion;
        }

        String recoveryOpinion = franchiseRecoveryRepository.findByCaseId(caseId)
                .map(item -> item.getOpinionCode())
                .orElse(null);
        if (recoveryOpinion != null && !recoveryOpinion.isBlank()) {
            return recoveryOpinion;
        }

        return null;
    }

    private boolean matchesManager(CaseEntity entity, String managerCode) {
        if (managerCode == null || managerCode.isBlank()) {
            return true;
        }

        return normalizeText(resolveManagerCode(entity.getId())).equals(normalizeText(managerCode));
    }

    private String resolveManagerCode(Long caseId) {
        String recoveryManager = franchiseRecoveryRepository.findByCaseId(caseId)
                .map(item -> item.getManagerCode())
                .orElse(null);
        if (recoveryManager != null && !recoveryManager.isBlank()) {
            return recoveryManager;
        }

        String legalManager = caseLegalRepository.findByCaseId(caseId)
                .map(item -> item.getProcessorCode())
                .orElse(null);
        if (legalManager != null && !legalManager.isBlank()) {
            return legalManager;
        }

        return null;
    }

    private boolean matchesVisibleState(CaseVisibleStateResponse state, String expectedValue) {
        if (expectedValue == null || expectedValue.isBlank()) {
            return true;
        }

        return normalizeText(state == null ? null : state.code()).equals(normalizeText(expectedValue))
                || normalizeText(state == null ? null : state.label()).equals(normalizeText(expectedValue));
    }

    private boolean matchesPaymentState(CaseResponse response, String paymentStateCode) {
        if (paymentStateCode == null || paymentStateCode.isBlank()) {
            return true;
        }

        return normalizeText(response.currentPaymentStateCode()).equals(normalizeText(paymentStateCode));
    }

    private boolean matchesPendingTasks(CaseEntity entity, CaseListFilters filters, List<OperationalTaskEntity> pendingTasks) {
        if (!shouldEvaluatePendingTasks(filters)) {
            return true;
        }

        List<OperationalTaskEntity> casePendingTasks = pendingTasks.stream()
                .filter(task -> entity.getId().equals(task.getCaseId()))
                .toList();

        if (filters.pendingTaskAssignedUserId() != null) {
            boolean assignedMatch = casePendingTasks.stream()
                    .anyMatch(task -> filters.pendingTaskAssignedUserId().equals(task.getAssignedUserId()));
            if (Boolean.FALSE.equals(filters.hasPendingTasks())) {
                return false;
            }
            return assignedMatch;
        }

        if (filters.hasPendingTasks() == null) {
            return true;
        }

        return filters.hasPendingTasks() ? !casePendingTasks.isEmpty() : casePendingTasks.isEmpty();
    }

    private boolean shouldEvaluatePendingTasks(CaseListFilters filters) {
        return filters != null && (filters.hasPendingTasks() != null || filters.pendingTaskAssignedUserId() != null);
    }

    private boolean shouldEvaluatePaidDate(CaseListFilters filters) {
        return filters != null && (filters.paidFrom() != null || filters.paidTo() != null);
    }

    private CaseResponse toResponse(CaseEntity entity) {
        CaseTypeEntity caseType = caseTypeRepository.findById(entity.getCaseTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe el tipo de tramite " + entity.getCaseTypeId()));
        BranchEntity branch = branchRepository.findById(entity.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe la sucursal " + entity.getBranchId()));
        WorkflowStateEntity caseState = entity.getCurrentCaseStateId() == null ? null : workflowStateRepository.findById(entity.getCurrentCaseStateId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe el estado de tramite " + entity.getCurrentCaseStateId()));
        WorkflowStateEntity repairState = entity.getCurrentRepairStateId() == null ? null : workflowStateRepository.findById(entity.getCurrentRepairStateId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe el estado de reparacion " + entity.getCurrentRepairStateId()));
        WorkflowStateEntity paymentState = entity.getCurrentPaymentStateId() == null ? null : workflowStateRepository.findById(entity.getCurrentPaymentStateId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe el estado de pago " + entity.getCurrentPaymentStateId()));
        WorkflowStateEntity documentationState = entity.getCurrentDocumentationStateId() == null ? null : workflowStateRepository.findById(entity.getCurrentDocumentationStateId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe el estado de documentacion " + entity.getCurrentDocumentationStateId()));
        WorkflowStateEntity legalState = entity.getCurrentLegalStateId() == null ? null : workflowStateRepository.findById(entity.getCurrentLegalStateId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe el estado legal " + entity.getCurrentLegalStateId()));
        Map<String, CaseVisibleStateResponse> visibleStates = caseVisibleStateResolver.resolveForCase(entity);

        String principalCustomerName = null;
        if (entity.getPrincipalCustomerPersonId() != null) {
            principalCustomerName = personRepository.findById(entity.getPrincipalCustomerPersonId())
                    .map(PersonEntity::getNombreMostrar)
                    .orElse(null);
        }
        String principalVehiclePlate = null;
        if (entity.getPrincipalVehicleId() != null) {
            principalVehiclePlate = vehicleRepository.findById(entity.getPrincipalVehicleId())
                    .map(VehicleEntity::getPlate)
                    .orElse(null);
        }
        String createdByDisplayName = userRepository.findById(entity.getCreatedByUserId())
                .map(this::buildUserDisplayName)
                .orElse(null);

        return new CaseResponse(
                entity.getId(),
                entity.getPublicId(),
                entity.getFolderCode(),
                entity.getOrderNumber(),
                entity.getCaseTypeId(),
                caseType.getCode(),
                entity.getOrganizationId(),
                entity.getBranchId(),
                branch.getCode(),
                entity.getPrincipalVehicleId(),
                entity.getPrincipalCustomerPersonId(),
                entity.getReferenced(),
                entity.getReferenciadorId(),
                entity.getCurrentCaseStateId(),
                caseState == null ? null : caseState.getCode(),
                entity.getCurrentRepairStateId(),
                repairState == null ? null : repairState.getCode(),
                entity.getCurrentPaymentStateId(),
                paymentState == null ? null : paymentState.getCode(),
                entity.getCurrentDocumentationStateId(),
                documentationState == null ? null : documentationState.getCode(),
                entity.getCurrentLegalStateId(),
                legalState == null ? null : legalState.getCode(),
                entity.getPriorityCode(),
                entity.getGeneralObservations(),
                entity.getClosedAt(),
                entity.getArchivedAt(),
                entity.getCreatedByUserId(),
                createdByDisplayName,
                entity.getCreatedAt(),
                compatibleVisibleCode(caseType.getCode(), visibleStates.get("tramite")),
                compatibleVisibleCode(caseType.getCode(), visibleStates.get("reparacion")),
                visibleStates.get("tramite"),
                visibleStates.get("reparacion"),
                principalCustomerName,
                principalVehiclePlate
        );
    }

    private CaseResponse toResponse(CaseEntity entity, Map<Long, PersonEntity> personsById, Map<Long, VehicleEntity> vehiclesById) {
        CaseTypeEntity caseType = caseTypeRepository.findById(entity.getCaseTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe el tipo de tramite " + entity.getCaseTypeId()));
        BranchEntity branch = branchRepository.findById(entity.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe la sucursal " + entity.getBranchId()));
        WorkflowStateEntity caseState = entity.getCurrentCaseStateId() == null ? null : workflowStateRepository.findById(entity.getCurrentCaseStateId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe el estado de tramite " + entity.getCurrentCaseStateId()));
        WorkflowStateEntity repairState = entity.getCurrentRepairStateId() == null ? null : workflowStateRepository.findById(entity.getCurrentRepairStateId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe el estado de reparacion " + entity.getCurrentRepairStateId()));
        WorkflowStateEntity paymentState = entity.getCurrentPaymentStateId() == null ? null : workflowStateRepository.findById(entity.getCurrentPaymentStateId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe el estado de pago " + entity.getCurrentPaymentStateId()));
        WorkflowStateEntity documentationState = entity.getCurrentDocumentationStateId() == null ? null : workflowStateRepository.findById(entity.getCurrentDocumentationStateId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe el estado de documentacion " + entity.getCurrentDocumentationStateId()));
        WorkflowStateEntity legalState = entity.getCurrentLegalStateId() == null ? null : workflowStateRepository.findById(entity.getCurrentLegalStateId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe el estado legal " + entity.getCurrentLegalStateId()));
        Map<String, CaseVisibleStateResponse> visibleStates = caseVisibleStateResolver.resolveForCase(entity);

        String principalCustomerName = null;
        if (entity.getPrincipalCustomerPersonId() != null) {
            PersonEntity person = personsById.get(entity.getPrincipalCustomerPersonId());
            principalCustomerName = person != null ? person.getNombreMostrar() : null;
        }
        String principalVehiclePlate = null;
        if (entity.getPrincipalVehicleId() != null) {
            VehicleEntity vehicle = vehiclesById.get(entity.getPrincipalVehicleId());
            principalVehiclePlate = vehicle != null ? vehicle.getPlate() : null;
        }
        String createdByDisplayName = userRepository.findById(entity.getCreatedByUserId())
                .map(this::buildUserDisplayName)
                .orElse(null);

        return new CaseResponse(
                entity.getId(),
                entity.getPublicId(),
                entity.getFolderCode(),
                entity.getOrderNumber(),
                entity.getCaseTypeId(),
                caseType.getCode(),
                entity.getOrganizationId(),
                entity.getBranchId(),
                branch.getCode(),
                entity.getPrincipalVehicleId(),
                entity.getPrincipalCustomerPersonId(),
                entity.getReferenced(),
                entity.getReferenciadorId(),
                entity.getCurrentCaseStateId(),
                caseState == null ? null : caseState.getCode(),
                entity.getCurrentRepairStateId(),
                repairState == null ? null : repairState.getCode(),
                entity.getCurrentPaymentStateId(),
                paymentState == null ? null : paymentState.getCode(),
                entity.getCurrentDocumentationStateId(),
                documentationState == null ? null : documentationState.getCode(),
                entity.getCurrentLegalStateId(),
                legalState == null ? null : legalState.getCode(),
                entity.getPriorityCode(),
                entity.getGeneralObservations(),
                entity.getClosedAt(),
                entity.getArchivedAt(),
                entity.getCreatedByUserId(),
                createdByDisplayName,
                entity.getCreatedAt(),
                compatibleVisibleCode(caseType.getCode(), visibleStates.get("tramite")),
                compatibleVisibleCode(caseType.getCode(), visibleStates.get("reparacion")),
                visibleStates.get("tramite"),
                visibleStates.get("reparacion"),
                principalCustomerName,
                principalVehiclePlate
        );
    }

    private String compatibleVisibleCode(String caseTypeCode, CaseVisibleStateResponse visibleState) {
        return ("PARTICULAR".equalsIgnoreCase(caseTypeCode) || "TODO_RIESGO".equalsIgnoreCase(caseTypeCode))
                && visibleState != null ? visibleState.code() : null;
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private CreationScope resolveCreationScope(AuthenticatedUser currentUser, Long requestedOrganizationId, Long requestedBranchId) {
        List<UserRoleEntity> activeRoles = userRoleRepository.findByUserIdAndActiveTrue(currentUser.id());
        if (activeRoles.isEmpty()) {
            throw new ConflictException("El usuario no tiene roles activos para crear carpetas");
        }

        Long organizationId = requestedOrganizationId;
        if (organizationId == null) {
            List<Long> organizationIds = activeRoles.stream()
                    .map(UserRoleEntity::getOrganizationId)
                    .distinct()
                    .toList();
            if (organizationIds.size() != 1) {
                throw new ConflictException("organizationId es obligatorio cuando el usuario tiene alcance a multiples organizaciones");
            }
            organizationId = organizationIds.get(0);
        }

        Long finalOrganizationId = organizationId;
        Long branchId = requestedBranchId;
        if (branchId == null) {
            List<Long> branchIds = activeRoles.stream()
                    .filter(role -> finalOrganizationId.equals(role.getOrganizationId()))
                    .map(UserRoleEntity::getBranchId)
                    .filter(id -> id != null)
                    .distinct()
                    .toList();
            if (branchIds.size() != 1) {
                throw new ConflictException("branchId es obligatorio cuando el usuario tiene alcance a multiples sucursales");
            }
            branchId = branchIds.get(0);
        }

        return new CreationScope(organizationId, branchId);
    }

    private String buildUserDisplayName(UserEntity user) {
        String firstName = blankToNull(user.getFirstName());
        String lastName = blankToNull(user.getLastName());
        if (firstName == null) {
            return lastName == null ? user.getUsername() : lastName;
        }
        return lastName == null ? firstName : firstName + " " + lastName;
    }

    private record CreationScope(Long organizationId, Long branchId) {}

    private void validateCaseCodes(String customerRoleCode, String principalVehicleRoleCode, String priorityCode) {
        String normalizedCustomerRoleCode = normalizeCode(customerRoleCode);
        String normalizedVehicleRoleCode = normalizeCode(principalVehicleRoleCode);
        String normalizedPriorityCode = normalizeCode(priorityCode);

        if (normalizedCustomerRoleCode == null || !caseRoleRepository.existsByCodeAndActiveTrue(normalizedCustomerRoleCode)) {
            throw new ConflictException("customerRoleCode no permitido: " + customerRoleCode);
        }
        if (normalizedVehicleRoleCode == null || !vehicleRoleRepository.existsByCodeAndActiveTrue(normalizedVehicleRoleCode)) {
            throw new ConflictException("principalVehicleRoleCode no permitido: " + principalVehicleRoleCode);
        }
        if (normalizedPriorityCode != null && !casePriorityRepository.existsByCodeAndActiveTrue(normalizedPriorityCode)) {
            throw new ConflictException("priorityCode no permitido: " + priorityCode);
        }
    }

    private String normalizeCode(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }
        return code.trim().toUpperCase();
    }

    private String normalizeText(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('_', ' ')
                .trim()
                .toUpperCase(Locale.ROOT);
        return normalized.replaceAll("\\s+", " ");
    }

    private boolean hasScope(AuthenticatedUser currentUser, CaseEntity caseEntity) {
        return caseAccessControlService.hasOrganizationScope(currentUser, caseEntity.getOrganizationId(), caseEntity.getBranchId());
    }

    private CaseRelationResponse toRelationResponse(CaseRelationEntity entity) {
        return new CaseRelationResponse(
                entity.getId(),
                entity.getSourceCaseId(),
                entity.getTargetCaseId(),
                entity.getRelationTypeCode(),
                entity.getDescription()
        );
    }

    private record CaseListItem(CaseEntity entity, CaseResponse response) {
    }
}
