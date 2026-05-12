package com.tallerzapata.backend.application.casefile;

import com.tallerzapata.backend.api.casefile.CaseCreateRequest;
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
import com.tallerzapata.backend.infrastructure.persistence.organization.BranchEntity;
import com.tallerzapata.backend.infrastructure.persistence.organization.BranchRepository;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleRepository;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleRoleRepository;
import com.tallerzapata.backend.infrastructure.persistence.workflow.CaseStateHistoryEntity;
import com.tallerzapata.backend.infrastructure.persistence.workflow.CaseStateHistoryRepository;
import com.tallerzapata.backend.infrastructure.persistence.workflow.WorkflowStateEntity;
import com.tallerzapata.backend.infrastructure.persistence.workflow.WorkflowStateRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService caseAccessControlService;
    private final CaseVisibleStateResolver caseVisibleStateResolver;

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
            CurrentUserService currentUserService,
            CaseAccessControlService caseAccessControlService,
            CaseVisibleStateResolver caseVisibleStateResolver
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
        this.currentUserService = currentUserService;
        this.caseAccessControlService = caseAccessControlService;
        this.caseVisibleStateResolver = caseVisibleStateResolver;
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
    public CasePageResponse list(int page, int size, Long organizationId, Long branchId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        caseAccessControlService.requirePermission(currentUser, "caso.ver");
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 100);

        List<CaseResponse> scopedItems = caseRepository.findAll(Sort.by(Sort.Direction.DESC, "id")).stream()
                .filter(item -> hasScope(currentUser, item))
                .filter(item -> organizationId == null || item.getOrganizationId().equals(organizationId))
                .filter(item -> branchId == null || item.getBranchId().equals(branchId))
                .map(this::toResponse)
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
        caseAccessControlService.requireOrganizationScope(currentUser, request.organizationId(), request.branchId());

        CaseTypeEntity caseType = caseTypeRepository.findById(request.caseTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe el tipo de tramite " + request.caseTypeId()));
        BranchEntity branch = branchRepository.findById(request.branchId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe la sucursal " + request.branchId()));

        if (!branch.getOrganizationId().equals(request.organizationId())) {
            throw new ResourceNotFoundException("La sucursal no pertenece a la organizacion indicada");
        }

        personRepository.findById(request.principalCustomerPersonId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe la persona principal " + request.principalCustomerPersonId()));
        vehicleRepository.findById(request.principalVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe el vehiculo principal " + request.principalVehicleId()));

        validateCaseCodes(request.customerRoleCode(), request.principalVehicleRoleCode(), request.priorityCode());

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

        Long nextOrderNumber = caseRepository.findMaxOrderNumberByOrganizationId(request.organizationId()) + 1;
        String folderCode = CaseFolderCodeGenerator.generate(nextOrderNumber, caseType.getFolderPrefix(), branch.getCode());

        CaseEntity entity = new CaseEntity();
        entity.setOrderNumber(nextOrderNumber);
        entity.setFolderCode(folderCode);
        entity.setCaseTypeId(caseType.getId());
        entity.setOrganizationId(request.organizationId());
        entity.setBranchId(request.branchId());
        entity.setPrincipalVehicleId(request.principalVehicleId());
        entity.setPrincipalCustomerPersonId(request.principalCustomerPersonId());
        entity.setReferenced(Boolean.TRUE.equals(request.referenced()));
        entity.setReferredByPersonId(request.referredByPersonId());
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
        casePerson.setCaseRoleCode(normalizeCode(request.customerRoleCode()));
        casePerson.setVehicleId(request.principalVehicleId());
        casePerson.setPrincipal(true);
        casePersonRepository.save(casePerson);

        CaseVehicleEntity caseVehicle = new CaseVehicleEntity();
        caseVehicle.setCaseId(entity.getId());
        caseVehicle.setVehicleId(request.principalVehicleId());
        caseVehicle.setVehicleRoleCode(normalizeCode(request.principalVehicleRoleCode()));
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
        metadata.put("customerRoleCode", request.customerRoleCode());
        metadata.put("principalVehicleRoleCode", request.principalVehicleRoleCode());

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

        return toResponse(entity);
    }

    @Transactional
    public CaseResponse update(Long caseId, CaseUpdateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity entity = getCase(caseId);
        caseAccessControlService.requireCaseAccess(currentUser, entity, "caso.crear");

        if (request.referredByPersonId() != null) {
            personRepository.findById(request.referredByPersonId())
                    .orElseThrow(() -> new ResourceNotFoundException("No existe la persona referida " + request.referredByPersonId()));
        }

        Map<String, Object> before = new LinkedHashMap<>();
        before.put("referenced", entity.getReferenced());
        before.put("referredByPersonId", entity.getReferredByPersonId());
        before.put("referredByText", entity.getReferredByText());
        before.put("priorityCode", entity.getPriorityCode());
        before.put("generalObservations", entity.getGeneralObservations());
        before.put("closedAt", entity.getClosedAt());
        before.put("archivedAt", entity.getArchivedAt());

        if (request.referenced() != null) {
            entity.setReferenced(request.referenced());
        }
        entity.setReferredByPersonId(request.referredByPersonId());
        entity.setReferredByText(blankToNull(request.referredByText()));
        entity.setPriorityCode(normalizeCode(request.priorityCode()));

        if (entity.getPriorityCode() != null && !casePriorityRepository.existsByCodeAndActiveTrue(entity.getPriorityCode())) {
            throw new ConflictException("priorityCode no permitido: " + entity.getPriorityCode());
        }
        entity.setGeneralObservations(blankToNull(request.generalObservations()));
        entity.setClosedAt(request.closedAt());
        entity.setArchivedAt(request.archivedAt());

        entity = caseRepository.save(entity);

        Map<String, Object> after = new LinkedHashMap<>();
        after.put("referenced", entity.getReferenced());
        after.put("referredByPersonId", entity.getReferredByPersonId());
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
                visibleStates.get("tramite"),
                visibleStates.get("reparacion")
        );
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

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
}
