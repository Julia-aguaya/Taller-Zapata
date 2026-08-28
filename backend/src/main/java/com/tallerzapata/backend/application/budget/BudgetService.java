package com.tallerzapata.backend.application.budget;

import com.tallerzapata.backend.api.budget.*;
import com.tallerzapata.backend.api.casefile.CodeCatalogResponse;
import com.tallerzapata.backend.application.casefile.CaseAuditService;
import com.tallerzapata.backend.application.casefile.ParticularCaseClosureService;
import com.tallerzapata.backend.application.casefile.particular.ParticularEffectiveStateRecalculator;
import com.tallerzapata.backend.application.casefile.todoriskstate.TodoRiesgoEffectiveStateRecalculator;
import com.tallerzapata.backend.application.cleas.CleasDownstreamGate;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.budget.*;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.InsurancePartsAuthorizationRepository;
import com.tallerzapata.backend.infrastructure.persistence.organization.BranchEntity;
import com.tallerzapata.backend.infrastructure.persistence.organization.BranchRepository;
import com.tallerzapata.backend.infrastructure.persistence.organization.OrganizationEntity;
import com.tallerzapata.backend.infrastructure.persistence.organization.OrganizationRepository;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonEntity;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.provider.ProviderEntity;
import com.tallerzapata.backend.infrastructure.persistence.provider.ProviderRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.time.LocalDateTime;

@Service
public class BudgetService {
    private final BudgetRepository budgetRepository;
    private final BudgetItemRepository budgetItemRepository;
    private final BudgetAccessoryWorkRepository budgetAccessoryWorkRepository;
    private final CasePartRepository casePartRepository;
    private final CaseRepository caseRepository;
    private final BudgetReportStatusRepository budgetReportStatusRepository;
    private final BudgetTaskRepository budgetTaskRepository;
    private final DamageLevelRepository damageLevelRepository;
    private final PartDecisionRepository partDecisionRepository;
    private final BudgetActionRepository budgetActionRepository;
    private final PartStatusRepository partStatusRepository;
    private final PartPurchaserRepository partPurchaserRepository;
    private final PartPaymentStatusRepository partPaymentStatusRepository;
    private final InsurancePartsAuthorizationRepository insurancePartsAuthorizationRepository;
    private final PersonRepository personRepository;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService accessControlService;
    private final CaseAuditService caseAuditService;
    private final BudgetPdfService budgetPdfService;
    private final ParticularCaseClosureService particularCaseClosureService;
    private final OrganizationRepository organizationRepository;
    private final BranchRepository branchRepository;
    private final ParticularEffectiveStateRecalculator particularEffectiveStateRecalculator;
    private final TodoRiesgoEffectiveStateRecalculator todoRiesgoEffectiveStateRecalculator;
    private final ProviderRepository providerRepository;
    private final BudgetComparisonService budgetComparisonService;
    private final CanonicalPartReconciliationService canonicalPartReconciliationService;
    private final CasePartReconciliationWarningRepository warningRepository;
    private final CleasDownstreamGate cleasDownstreamGate;

    public BudgetService(BudgetRepository budgetRepository, BudgetItemRepository budgetItemRepository, BudgetAccessoryWorkRepository budgetAccessoryWorkRepository, CasePartRepository casePartRepository, CaseRepository caseRepository, BudgetReportStatusRepository budgetReportStatusRepository, BudgetTaskRepository budgetTaskRepository, DamageLevelRepository damageLevelRepository, PartDecisionRepository partDecisionRepository, BudgetActionRepository budgetActionRepository, PartStatusRepository partStatusRepository, PartPurchaserRepository partPurchaserRepository, PartPaymentStatusRepository partPaymentStatusRepository, InsurancePartsAuthorizationRepository insurancePartsAuthorizationRepository, PersonRepository personRepository, CurrentUserService currentUserService, CaseAccessControlService accessControlService, CaseAuditService caseAuditService,             BudgetPdfService budgetPdfService, ParticularCaseClosureService particularCaseClosureService,
            OrganizationRepository organizationRepository, BranchRepository branchRepository, ParticularEffectiveStateRecalculator particularEffectiveStateRecalculator, TodoRiesgoEffectiveStateRecalculator todoRiesgoEffectiveStateRecalculator, ProviderRepository providerRepository, BudgetComparisonService budgetComparisonService, CanonicalPartReconciliationService canonicalPartReconciliationService, CasePartReconciliationWarningRepository warningRepository, CleasDownstreamGate cleasDownstreamGate) {
        this.budgetRepository = budgetRepository;
        this.budgetItemRepository = budgetItemRepository;
        this.budgetAccessoryWorkRepository = budgetAccessoryWorkRepository;
        this.casePartRepository = casePartRepository;
        this.caseRepository = caseRepository;
        this.budgetReportStatusRepository = budgetReportStatusRepository;
        this.budgetTaskRepository = budgetTaskRepository;
        this.damageLevelRepository = damageLevelRepository;
        this.partDecisionRepository = partDecisionRepository;
        this.budgetActionRepository = budgetActionRepository;
        this.partStatusRepository = partStatusRepository;
        this.partPurchaserRepository = partPurchaserRepository;
        this.partPaymentStatusRepository = partPaymentStatusRepository;
        this.insurancePartsAuthorizationRepository = insurancePartsAuthorizationRepository;
        this.personRepository = personRepository;
        this.currentUserService = currentUserService;
        this.accessControlService = accessControlService;
        this.caseAuditService = caseAuditService;
        this.budgetPdfService = budgetPdfService;
        this.particularCaseClosureService = particularCaseClosureService;
        this.organizationRepository = organizationRepository;
        this.branchRepository = branchRepository;
        this.particularEffectiveStateRecalculator = particularEffectiveStateRecalculator;
        this.todoRiesgoEffectiveStateRecalculator = todoRiesgoEffectiveStateRecalculator;
        this.providerRepository = providerRepository;
        this.budgetComparisonService = budgetComparisonService;
        this.canonicalPartReconciliationService = canonicalPartReconciliationService;
        this.warningRepository = warningRepository;
        this.cleasDownstreamGate = cleasDownstreamGate;
    }

    @Transactional(readOnly = true)
    public PartsCatalogsResponse listPartsCatalogs() {
        return new PartsCatalogsResponse(
                partStatusRepository.findAll().stream().filter(item -> Boolean.TRUE.equals(item.getActive())).map(item -> new CodeCatalogResponse(item.getCode(), item.getName())).toList(),
                partPurchaserRepository.findAll().stream().filter(item -> Boolean.TRUE.equals(item.getActive())).map(item -> new CodeCatalogResponse(item.getCode(), item.getName())).toList(),
                partPaymentStatusRepository.findAll().stream().filter(item -> Boolean.TRUE.equals(item.getActive())).map(item -> new CodeCatalogResponse(item.getCode(), item.getName())).toList(),
                insurancePartsAuthorizationRepository.findAll().stream().filter(item -> Boolean.TRUE.equals(item.getActive())).map(item -> new CodeCatalogResponse(item.getCode(), item.getName())).toList()
        );
    }

    @Transactional(readOnly = true)
    public BudgetResponse getBudget(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "presupuesto.ver");
        BudgetEntity budget = budgetRepository.findByCaseId(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe presupuesto para el caso " + caseId));
        List<BudgetItemResponse> items = budgetItemRepository.findByBudgetIdOrderByVisualOrderAsc(budget.getId()).stream().map(this::toBudgetItemResponse).toList();
        return toBudgetResponse(budget, items);
    }

    @Transactional(readOnly = true)
    public BudgetCatalogsResponse listCatalogs() {
        return new BudgetCatalogsResponse(
                budgetReportStatusRepository.findAll().stream().filter(item -> Boolean.TRUE.equals(item.getActive())).map(item -> new CodeCatalogResponse(item.getCode(), item.getName())).toList(),
                budgetTaskRepository.findAll().stream().filter(item -> Boolean.TRUE.equals(item.getActive())).map(item -> new CodeCatalogResponse(item.getCode(), item.getName())).toList(),
                damageLevelRepository.findAll().stream().filter(item -> Boolean.TRUE.equals(item.getActive())).map(item -> new CodeCatalogResponse(item.getCode(), item.getName())).toList(),
                partDecisionRepository.findAll().stream().filter(item -> Boolean.TRUE.equals(item.getActive())).map(item -> new CodeCatalogResponse(item.getCode(), item.getName())).toList(),
                budgetActionRepository.findAll().stream().filter(item -> Boolean.TRUE.equals(item.getActive())).map(item -> new CodeCatalogResponse(item.getCode(), item.getName())).toList()
        );
    }

    @Transactional(readOnly = true)
    public byte[] generatePdf(Long caseId) {
        var data = loadPdfData(caseId);
        CaseEntity caseEntity = requireCase(caseId);
        OrganizationEntity org = caseEntity.getOrganizationId() != null ? organizationRepository.findById(caseEntity.getOrganizationId()).orElse(null) : null;
        BranchEntity branch = caseEntity.getBranchId() != null ? branchRepository.findById(caseEntity.getBranchId()).orElse(null) : null;
        return budgetPdfService.generate(data.budget(), data.items(), data.folderCode(), org, branch);
    }

    private PdfData loadPdfData(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "presupuesto.ver");
        BudgetEntity budget = budgetRepository.findByCaseId(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe presupuesto para el caso " + caseId));
        if (!"CERRADO".equals(budget.getReportStatusCode())) {
            throw new ConflictException("El presupuesto debe estar en estado CERRADO para generar el PDF. Estado actual: " + budget.getReportStatusCode());
        }
        List<BudgetItemEntity> items = budgetItemRepository.findByBudgetIdOrderByVisualOrderAsc(budget.getId());
        return new PdfData(budget, items, caseEntity.getFolderCode());
    }

    private record PdfData(BudgetEntity budget, List<BudgetItemEntity> items, String folderCode) {}

    @Transactional
    public BudgetResponse upsertBudget(Long caseId, BudgetUpsertRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCaseForUpdate(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "presupuesto.crear");
        if (request.reportStatusCode() != null && !budgetReportStatusRepository.existsByCodeAndActiveTrue(normalizeCode(request.reportStatusCode()))) throw new ConflictException("reportStatusCode no permitido: " + request.reportStatusCode());

        BudgetEntity entity = budgetRepository.findByCaseId(caseId).orElseGet(BudgetEntity::new);
        boolean isCreate = entity.getId() == null;
        entity.setCaseId(caseId);
        entity.setOrganizationId(caseEntity.getOrganizationId());
        entity.setBranchId(caseEntity.getBranchId());
        entity.setBudgetDate(request.budgetDate());
        entity.setReportStatusCode(normalizedOptionalCode(request.reportStatusCode()));
        BigDecimal laborWithoutVat = scale(request.laborWithoutVat());
        BigDecimal vatRate = request.vatRate() != null ? scale(request.vatRate()) : new BigDecimal("21.00");
        BigDecimal laborVat = BudgetCalculator.calculateLaborVat(laborWithoutVat, vatRate);
        BigDecimal laborWithVat = BudgetCalculator.calculateLaborWithVat(laborWithoutVat, laborVat);
        BigDecimal partsTotal = scale(request.partsTotal());
        BigDecimal totalQuoted = BudgetCalculator.calculateTotalQuoted(laborWithVat, partsTotal);
        entity.setLaborWithoutVat(laborWithoutVat);
        entity.setVatRate(vatRate);
        entity.setLaborVat(laborVat);
        entity.setLaborWithVat(laborWithVat);
        entity.setPartsTotal(partsTotal);
        entity.setTotalQuoted(totalQuoted);
        entity.setEstimatedDays(request.estimatedDays());
        entity.setMinimumCloseAmount(scale(request.minimumCloseAmount()));
        entity.setObservations(blankToNull(request.observations()));
        entity.setAuthorizedByName(blankToNull(request.authorizedByName()) != null ? blankToNull(request.authorizedByName()) : blankToNull(currentUser.displayName()));
        entity.setInterestedName(blankToNull(request.interestedName()) != null ? blankToNull(request.interestedName()) : resolveInterestedName(caseEntity));
        entity.setBenchStraighteningApplies(request.benchStraighteningApplies());
        entity.setBenchStraighteningDetail(blankToNull(request.benchStraighteningDetail()));
        entity.setAlignmentApplies(request.alignmentApplies());
        entity.setAlignmentDetail(blankToNull(request.alignmentDetail()));
        entity.setBalancingApplies(request.balancingApplies());
        entity.setBalancingDetail(blankToNull(request.balancingDetail()));
        entity.setGlassReplacementApplies(request.glassReplacementApplies());
        entity.setGlassReplacementDetail(blankToNull(request.glassReplacementDetail()));
        entity.setElectricalWorkApplies(request.electricalWorkApplies());
        entity.setElectricalDetail(blankToNull(request.electricalDetail()));
        entity.setMechanicalWorkApplies(request.mechanicalWorkApplies());
        entity.setMechanicalWorkCode(normalizedOptionalCode(request.mechanicalWorkCode()));
        entity.setQuotedPartsDate(request.quotedPartsDate());
        applyBudgetProvider(entity, request.providerId(), request.quotedPartsSupplier());
        entity.setCurrentVersion(isCreate ? 1 : entity.getCurrentVersion() + 1);
        entity = budgetRepository.save(entity);
        if (request.items() != null) {
            reconcileBudgetItems(entity.getId(), request.items());
        }
        if (request.accessoryWorks() != null) {
            reconcileAccessoryWorks(entity.getId(), request.accessoryWorks());
        }
        if (request.items() != null && request.accessoryWorks() != null) {
            canonicalPartReconciliationService.reconcile(caseId, currentUser, httpRequest);
        }
        caseAuditService.register(currentUser.id(), caseId, "presupuestos", entity.getId(), "upsert_presupuesto", null, caseAuditService.toJson(Map.of("reportStatusCode", entity.getReportStatusCode(), "totalQuoted", entity.getTotalQuoted())), caseAuditService.toJson(Map.of("domain", "presupuestos")), httpRequest);
        particularCaseClosureService.syncClosure(caseId);
        particularEffectiveStateRecalculator.recalculate(caseId);
        todoRiesgoEffectiveStateRecalculator.recalculate(caseId);
        List<BudgetItemResponse> items = budgetItemRepository.findByBudgetIdOrderByVisualOrderAsc(entity.getId()).stream().map(this::toBudgetItemResponse).toList();
        return toBudgetResponse(entity, items);
    }

    @Transactional
    public BudgetResponse closeBudget(Long caseId, BudgetCloseRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCaseForUpdate(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "presupuesto.crear");
        if (request.reportStatusCode() != null && !budgetReportStatusRepository.existsByCodeAndActiveTrue(normalizeCode(request.reportStatusCode()))) throw new ConflictException("reportStatusCode no permitido: " + request.reportStatusCode());
        BudgetEntity entity = budgetRepository.findByCaseId(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe presupuesto para el caso " + caseId));
        entity.setReportStatusCode(normalizedOptionalCode(request.reportStatusCode()));
        entity.setObservations(blankToNull(request.observations()));
        entity = budgetRepository.save(entity);
        canonicalPartReconciliationService.reconcile(caseId, currentUser, httpRequest);
        caseAuditService.register(currentUser.id(), caseId, "presupuestos", entity.getId(), "cerrar_presupuesto", null, caseAuditService.toJson(Map.of("reportStatusCode", entity.getReportStatusCode())), caseAuditService.toJson(Map.of("domain", "presupuestos")), httpRequest);
        particularCaseClosureService.syncClosure(caseId);
        particularEffectiveStateRecalculator.recalculate(caseId);
        todoRiesgoEffectiveStateRecalculator.recalculate(caseId);
        List<BudgetItemResponse> items = budgetItemRepository.findByBudgetIdOrderByVisualOrderAsc(entity.getId()).stream().map(this::toBudgetItemResponse).toList();
        return toBudgetResponse(entity, items);
    }

    @Transactional
    public BudgetGenerateResponse generateBudget(Long caseId, BudgetUpsertRequest request, String idempotencyKey, HttpServletRequest httpRequest) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) throw new ConflictException("Idempotency-Key es obligatorio");
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCaseForUpdate(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "presupuesto.crear");
        String key = idempotencyKey.trim();
        var existing = budgetComparisonService.findSnapshot(caseId, key);
        if (existing.isPresent()) {
            BudgetEntity budget = budgetRepository.findByCaseId(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe presupuesto para el caso " + caseId));
            return new BudgetGenerateResponse(toBudgetResponse(budget, budgetItemRepository.findByBudgetIdOrderByVisualOrderAsc(budget.getId()).stream().map(this::toBudgetItemResponse).toList()), existing.get());
        }
        BudgetUpsertRequest closedRequest = new BudgetUpsertRequest(request.budgetDate(), "CERRADO", request.laborWithoutVat(), request.vatRate(), request.partsTotal(), request.estimatedDays(), request.minimumCloseAmount(), request.observations(), request.authorizedByName(), request.interestedName(), request.benchStraighteningApplies(), request.benchStraighteningDetail(), request.alignmentApplies(), request.alignmentDetail(), request.balancingApplies(), request.balancingDetail(), request.glassReplacementApplies(), request.glassReplacementDetail(), request.electricalWorkApplies(), request.electricalDetail(), request.mechanicalWorkApplies(), request.mechanicalWorkCode(), request.quotedPartsDate(), request.quotedPartsSupplier(), request.providerId(), request.items(), request.accessoryWorks());
        BudgetResponse budget = upsertBudget(caseId, closedRequest, httpRequest);
        BudgetEntity entity = budgetRepository.findByCaseId(caseId).orElseThrow();
        canonicalPartReconciliationService.reconcile(caseId, currentUser, httpRequest);
        var snapshot = budgetComparisonService.createSnapshot(caseId, entity, budgetItemRepository.findByBudgetIdOrderByVisualOrderAsc(entity.getId()), key);
        return new BudgetGenerateResponse(budget, snapshot);
    }

    @Transactional(readOnly = true)
    public List<BudgetItemResponse> listBudgetItems(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "presupuesto.ver");
        BudgetEntity budget = budgetRepository.findByCaseId(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe presupuesto para el caso " + caseId));
        return budgetItemRepository.findByBudgetIdOrderByVisualOrderAsc(budget.getId()).stream().map(this::toBudgetItemResponse).toList();
    }

    @Transactional
    public BudgetItemResponse createBudgetItem(Long caseId, BudgetItemCreateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCaseForUpdate(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "presupuesto.crear");
        BudgetEntity budget = budgetRepository.findByCaseId(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe presupuesto para el caso " + caseId));
        validateBudgetItemCreateRequest(request);
        BudgetItemEntity entity = new BudgetItemEntity();
        entity.setBudgetId(budget.getId());
        entity.setVisualOrder(request.visualOrder());
        entity.setAffectedPiece(request.affectedPiece().trim());
        entity.setTaskCode(normalizedOptionalCode(request.taskCode()));
        entity.setDamageLevelCode(normalizedOptionalCode(request.damageLevelCode()));
        entity.setPartDecisionCode(normalizedOptionalCode(request.partDecisionCode()));
        entity.setActionCode(normalizedOptionalCode(request.actionCode()));
        entity.setRequiresReplacement(Boolean.TRUE.equals(request.requiresReplacement()));
        entity.setPartValue(scale(request.partValue()));
        entity.setEstimatedHours(scale(request.estimatedHours()));
        entity.setLaborAmount(scale(request.laborAmount()));
        applyBudgetItemProvider(entity, request.providerId());
        entity.setActive(true);
        entity = budgetItemRepository.save(entity);
        caseAuditService.register(currentUser.id(), caseId, "presupuesto_items", entity.getId(), "crear_presupuesto_item", null, caseAuditService.toJson(Map.of("affectedPiece", entity.getAffectedPiece(), "taskCode", entity.getTaskCode())), caseAuditService.toJson(Map.of("domain", "presupuestos")), httpRequest);
        return toBudgetItemResponse(entity);
    }

    @Transactional
    public BudgetItemResponse updateBudgetItem(Long caseId, Long itemId, BudgetItemUpdateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCaseForUpdate(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "presupuesto.crear");
        BudgetEntity budget = budgetRepository.findByCaseId(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe presupuesto para el caso " + caseId));
        BudgetItemEntity entity = budgetItemRepository.findById(itemId).orElseThrow(() -> new ResourceNotFoundException("No existe el item " + itemId));
        if (!entity.getBudgetId().equals(budget.getId())) throw new ConflictException("El item no pertenece al presupuesto del caso");
        validateBudgetItemUpdateRequest(request);
        entity.setVisualOrder(request.visualOrder());
        entity.setAffectedPiece(request.affectedPiece().trim());
        entity.setTaskCode(normalizedOptionalCode(request.taskCode()));
        entity.setDamageLevelCode(normalizedOptionalCode(request.damageLevelCode()));
        entity.setPartDecisionCode(normalizedOptionalCode(request.partDecisionCode()));
        entity.setActionCode(normalizedOptionalCode(request.actionCode()));
        entity.setRequiresReplacement(Boolean.TRUE.equals(request.requiresReplacement()));
        entity.setPartValue(scale(request.partValue()));
        entity.setEstimatedHours(scale(request.estimatedHours()));
        entity.setLaborAmount(scale(request.laborAmount()));
        applyBudgetItemProvider(entity, request.providerId());
        entity.setActive(request.active() == null || request.active());
        entity = budgetItemRepository.save(entity);
        caseAuditService.register(currentUser.id(), caseId, "presupuesto_items", entity.getId(), "actualizar_presupuesto_item", null, caseAuditService.toJson(Map.of("affectedPiece", entity.getAffectedPiece(), "taskCode", entity.getTaskCode())), caseAuditService.toJson(Map.of("domain", "presupuestos")), httpRequest);
        return toBudgetItemResponse(entity);
    }

    @Transactional(readOnly = true)
    public List<CasePartResponse> listCaseParts(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "presupuesto.ver");
        return casePartRepository.findByCaseIdOrderByIdAsc(caseId).stream().map(this::toCasePartResponse).toList();
    }

    @Transactional
    public CasePartResponse createCasePart(Long caseId, CasePartCreateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCaseForUpdate(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "presupuesto.crear");
        validateCasePartRequest(request);
        CasePartEntity entity = new CasePartEntity();
        entity.setCaseId(caseId);
        entity.setBudgetItemId(null);
        entity.setDescription(request.description().trim());
        entity.setPartCode(blankToNull(request.partCode()));
        applyCasePartProvider(entity, request.providerId(), request.finalSupplier());
        entity.setAuthorizedCode(normalizedOptionalCode(request.authorizationCode()));
        entity.setStatusCode(normalizeCode(request.statusCode()));
        entity.setPurchasedByCode(normalizedOptionalCode(request.purchasedByCode()));
        entity.setPaymentStatusCode(normalizedOptionalCode(request.paymentStatusCode()));
        entity.setBudgetedPrice(scale(request.budgetedPrice()));
        entity.setFinalPrice(scale(request.finalPrice()));
        entity.setReceivedDate(request.receivedDate());
        entity.setUsed(Boolean.TRUE.equals(request.used()));
        entity.setReturned(Boolean.TRUE.equals(request.returned()));
        entity.setProviderAssignmentOrigin(ProviderAssignmentOrigin.MANUAL);
        entity.setSourceType(CasePartSourceType.MANUAL);
        entity.setNonCanonical(false);
        entity.setAccessory(false);
        entity = casePartRepository.save(entity);
        caseAuditService.register(currentUser.id(), caseId, "repuestos_caso", entity.getId(), "crear_repuesto_caso", null, caseAuditService.toJson(Map.of("description", entity.getDescription(), "statusCode", entity.getStatusCode())), caseAuditService.toJson(Map.of("domain", "presupuestos")), httpRequest);
        particularEffectiveStateRecalculator.recalculate(caseId);
        todoRiesgoEffectiveStateRecalculator.recalculate(caseId);
        return toCasePartResponse(entity);
    }

    @Transactional
    public CasePartResponse updateCasePart(Long caseId, Long partId, CasePartUpdateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCaseForUpdate(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "presupuesto.crear");
        CasePartEntity entity = casePartRepository.findById(partId).orElseThrow(() -> new ResourceNotFoundException("No existe el repuesto " + partId));
        if (!entity.getCaseId().equals(caseId)) throw new ConflictException("El repuesto no pertenece al caso indicado");
        validateCasePartUpdateRequest(request);
        entity.setDescription(request.description().trim());
        entity.setPartCode(blankToNull(request.partCode()));
        applyCasePartProvider(entity, request.providerId(), request.finalSupplier());
        entity.setAuthorizedCode(normalizedOptionalCode(request.authorizationCode()));
        entity.setStatusCode(normalizeCode(request.statusCode()));
        entity.setPurchasedByCode(normalizedOptionalCode(request.purchasedByCode()));
        entity.setPaymentStatusCode(normalizedOptionalCode(request.paymentStatusCode()));
        entity.setBudgetedPrice(scale(request.budgetedPrice()));
        entity.setFinalPrice(scale(request.finalPrice()));
        entity.setReceivedDate(request.receivedDate());
        entity.setUsed(Boolean.TRUE.equals(request.used()));
        entity.setReturned(Boolean.TRUE.equals(request.returned()));
        entity.setProviderAssignmentOrigin(ProviderAssignmentOrigin.MANUAL);
        entity = casePartRepository.save(entity);
        caseAuditService.register(currentUser.id(), caseId, "repuestos_caso", entity.getId(), "actualizar_repuesto_caso", null, caseAuditService.toJson(Map.of("description", entity.getDescription(), "statusCode", entity.getStatusCode())), caseAuditService.toJson(Map.of("domain", "presupuestos")), httpRequest);
        particularEffectiveStateRecalculator.recalculate(caseId);
        todoRiesgoEffectiveStateRecalculator.recalculate(caseId);
        return toCasePartResponse(entity);
    }

    @Transactional
    public void deleteCasePart(Long caseId, Long partId, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCaseForUpdate(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "presupuesto.crear");
        CasePartEntity entity = casePartRepository.findById(partId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el repuesto " + partId));
        if (!entity.getCaseId().equals(caseId))
            throw new ConflictException("El repuesto no pertenece al caso indicado");
        casePartRepository.delete(entity);
        caseAuditService.register(currentUser.id(), caseId, "repuestos_caso", partId,
                "eliminar_repuesto_caso",
                caseAuditService.toJson(Map.of("description", entity.getDescription(), "statusCode", entity.getStatusCode())),
                null,
                caseAuditService.toJson(Map.of("domain", "presupuestos")), httpRequest);
        particularEffectiveStateRecalculator.recalculate(caseId);
        todoRiesgoEffectiveStateRecalculator.recalculate(caseId);
    }

    @Transactional
    public List<CasePartResponse> syncPartsFromBudget(Long caseId, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCaseForUpdate(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "presupuesto.crear");
        return canonicalPartReconciliationService.reconcile(caseId, currentUser, httpRequest).stream().map(this::toCasePartResponse).toList();
    }

    @Transactional
    public CasePartReconciliationWarningResponse resolveReconciliationWarning(Long caseId, Long partId, Long warningId, CasePartWarningResolutionRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCaseForUpdate(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "presupuesto.crear");
        CasePartEntity part = casePartRepository.findById(partId).orElseThrow(() -> new ResourceNotFoundException("No existe el repuesto " + partId));
        if (!part.getCaseId().equals(caseId)) throw new ConflictException("El repuesto no pertenece al caso indicado");
        CasePartReconciliationWarningEntity warning = warningRepository.findById(warningId).orElseThrow(() -> new ResourceNotFoundException("No existe la advertencia " + warningId));
        if (!warning.getCaseId().equals(caseId) || !warning.getPartId().equals(partId)) throw new ConflictException("La advertencia no pertenece al repuesto indicado");
        if (warning.getState() != CasePartReconciliationWarningState.OPEN) throw new ConflictException("La advertencia ya fue resuelta");
        warning.setState(CasePartReconciliationWarningState.RESOLVED);
        warning.setResolution(caseAuditService.toJson(Map.of("resolution", request.resolution().trim())));
        warning.setResolvedAt(LocalDateTime.now());
        warning.setResolvedBy(currentUser.id());
        warningRepository.save(warning);
        caseAuditService.register(currentUser.id(), caseId, "repuestos_caso_reconciliation_warnings", warning.getId(), "resolver_advertencia_reconciliacion", null, warning.getResolution(), caseAuditService.toJson(Map.of("partId", partId)), httpRequest);
        return toWarningResponse(warning);
    }

    private void validateBudgetItemCreateRequest(BudgetItemCreateRequest request) {
        if (request.taskCode() != null && !budgetTaskRepository.existsByCodeAndActiveTrue(normalizeCode(request.taskCode()))) throw new ConflictException("taskCode no permitido: " + request.taskCode());
        if (request.damageLevelCode() != null && !damageLevelRepository.existsByCodeAndActiveTrue(normalizeCode(request.damageLevelCode()))) throw new ConflictException("damageLevelCode no permitido: " + request.damageLevelCode());
        if (request.partDecisionCode() != null && !partDecisionRepository.existsByCodeAndActiveTrue(normalizeCode(request.partDecisionCode()))) throw new ConflictException("partDecisionCode no permitido: " + request.partDecisionCode());
        if (request.actionCode() != null && !budgetActionRepository.existsByCodeAndActiveTrue(normalizeCode(request.actionCode()))) throw new ConflictException("actionCode no permitido: " + request.actionCode());
    }

    private void validateBudgetItemUpdateRequest(BudgetItemUpdateRequest request) {
        if (request.taskCode() != null && !budgetTaskRepository.existsByCodeAndActiveTrue(normalizeCode(request.taskCode()))) throw new ConflictException("taskCode no permitido: " + request.taskCode());
        if (request.damageLevelCode() != null && !damageLevelRepository.existsByCodeAndActiveTrue(normalizeCode(request.damageLevelCode()))) throw new ConflictException("damageLevelCode no permitido: " + request.damageLevelCode());
        if (request.partDecisionCode() != null && !partDecisionRepository.existsByCodeAndActiveTrue(normalizeCode(request.partDecisionCode()))) throw new ConflictException("partDecisionCode no permitido: " + request.partDecisionCode());
        if (request.actionCode() != null && !budgetActionRepository.existsByCodeAndActiveTrue(normalizeCode(request.actionCode()))) throw new ConflictException("actionCode no permitido: " + request.actionCode());
    }

    private void reconcileBudgetItems(Long budgetId, List<BudgetItemCreateRequest> requestedItems) {
        Map<Integer, BudgetItemEntity> existingByVisualOrder = new HashMap<>();
        for (BudgetItemEntity existing : budgetItemRepository.findByBudgetIdOrderByVisualOrderAsc(budgetId)) {
            existingByVisualOrder.putIfAbsent(existing.getVisualOrder(), existing);
        }
        for (BudgetItemCreateRequest requested : requestedItems) {
            validateBudgetItemCreateRequest(requested);
            BudgetItemEntity item = existingByVisualOrder.remove(requested.visualOrder());
            if (item == null) {
                item = new BudgetItemEntity();
                item.setBudgetId(budgetId);
            }
            item.setVisualOrder(requested.visualOrder());
            item.setAffectedPiece(requested.affectedPiece().trim());
            item.setTaskCode(normalizedOptionalCode(requested.taskCode()));
            item.setDamageLevelCode(normalizedOptionalCode(requested.damageLevelCode()));
            item.setPartDecisionCode(normalizedOptionalCode(requested.partDecisionCode()));
            item.setActionCode(normalizedOptionalCode(requested.actionCode()));
            item.setRequiresReplacement(Boolean.TRUE.equals(requested.requiresReplacement()));
            item.setPartValue(scale(requested.partValue()));
            item.setEstimatedHours(scale(requested.estimatedHours()));
            item.setLaborAmount(scale(requested.laborAmount()));
            applyBudgetItemProvider(item, requested.providerId());
            item.setActive(true);
            budgetItemRepository.save(item);
        }
        // Retain omitted rows so repuestos and comparison snapshots keep their source ID.
        for (BudgetItemEntity omitted : existingByVisualOrder.values()) {
            omitted.setActive(false);
            budgetItemRepository.save(omitted);
        }
    }

    private void reconcileAccessoryWorks(Long budgetId, List<BudgetAccessoryWorkRequest> requestedWorks) {
        Map<Long, BudgetAccessoryWorkEntity> existingById = new HashMap<>();
        for (BudgetAccessoryWorkEntity existing : budgetAccessoryWorkRepository.findByBudgetIdOrderByIdAsc(budgetId)) existingById.put(existing.getId(), existing);
        for (BudgetAccessoryWorkRequest requested : requestedWorks) {
            if (requested.actionCode() != null && !requested.actionCode().isBlank() && !budgetActionRepository.existsByCodeAndActiveTrue(normalizeCode(requested.actionCode()))) throw new ConflictException("actionCode no permitido: " + requested.actionCode());
            if (requested.damageLevelCode() != null && !requested.damageLevelCode().isBlank() && !damageLevelRepository.existsByCodeAndActiveTrue(normalizeCode(requested.damageLevelCode()))) throw new ConflictException("damageLevelCode no permitido: " + requested.damageLevelCode());
            BudgetAccessoryWorkEntity work = requested.id() == null ? new BudgetAccessoryWorkEntity() : existingById.remove(requested.id());
            if (work == null) throw new ConflictException("El trabajo extra no pertenece al presupuesto");
            work.setBudgetId(budgetId);
            work.setAffectedPiece(blankToNull(requested.affectedPiece()));
            work.setActionCode(normalizedOptionalCode(requested.actionCode()));
            work.setDamageLevelCode(normalizedOptionalCode(requested.damageLevelCode()));
            work.setReplacementAmount(scale(requested.replacementAmount()) == null ? BigDecimal.ZERO : scale(requested.replacementAmount()));
            work.setActive(true);
            budgetAccessoryWorkRepository.save(work);
        }
        for (BudgetAccessoryWorkEntity omitted : existingById.values()) { omitted.setActive(false); budgetAccessoryWorkRepository.save(omitted); }
    }

    private void validateCasePartRequest(CasePartCreateRequest request) {
        if (request.authorizationCode() != null && !insurancePartsAuthorizationRepository.existsByCodeAndActiveTrue(normalizeCode(request.authorizationCode()))) throw new ConflictException("authorizationCode no permitido: " + request.authorizationCode());
        if (!partStatusRepository.existsByCodeAndActiveTrue(normalizeCode(request.statusCode()))) throw new ConflictException("statusCode no permitido: " + request.statusCode());
        if (request.purchasedByCode() != null && !partPurchaserRepository.existsByCodeAndActiveTrue(normalizeCode(request.purchasedByCode()))) throw new ConflictException("purchasedByCode no permitido: " + request.purchasedByCode());
        if (request.paymentStatusCode() != null && !partPaymentStatusRepository.existsByCodeAndActiveTrue(normalizeCode(request.paymentStatusCode()))) throw new ConflictException("paymentStatusCode no permitido: " + request.paymentStatusCode());
    }

    private void validateCasePartUpdateRequest(CasePartUpdateRequest request) {
        if (request.authorizationCode() != null && !insurancePartsAuthorizationRepository.existsByCodeAndActiveTrue(normalizeCode(request.authorizationCode()))) throw new ConflictException("authorizationCode no permitido: " + request.authorizationCode());
        if (!partStatusRepository.existsByCodeAndActiveTrue(normalizeCode(request.statusCode()))) throw new ConflictException("statusCode no permitido: " + request.statusCode());
        if (request.purchasedByCode() != null && !partPurchaserRepository.existsByCodeAndActiveTrue(normalizeCode(request.purchasedByCode()))) throw new ConflictException("purchasedByCode no permitido: " + request.purchasedByCode());
        if (request.paymentStatusCode() != null && !partPaymentStatusRepository.existsByCodeAndActiveTrue(normalizeCode(request.paymentStatusCode()))) throw new ConflictException("paymentStatusCode no permitido: " + request.paymentStatusCode());
    }

    private CaseEntity requireCase(Long caseId) { return caseRepository.findById(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId)); }
    private CaseEntity requireCaseForUpdate(Long caseId) {
        CaseEntity caseEntity = caseRepository.findByIdForUpdate(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
        cleasDownstreamGate.requireAllowed(caseEntity);
        return caseEntity;
    }

    private BudgetResponse toBudgetResponse(BudgetEntity e, List<BudgetItemResponse> items) {
        List<BudgetAccessoryWorkResponse> accessoryWorks = budgetAccessoryWorkRepository.findByBudgetIdOrderByIdAsc(e.getId()).stream().map(work -> new BudgetAccessoryWorkResponse(work.getId(), work.getAffectedPiece(), work.getActionCode(), work.getDamageLevelCode(), work.getReplacementAmount(), work.getActive())).toList();
        return new BudgetResponse(e.getId(), e.getCaseId(), e.getOrganizationId(), e.getBranchId(), e.getBudgetDate(), e.getReportStatusCode(), e.getLaborWithoutVat(), e.getVatRate(), e.getLaborVat(), e.getLaborWithVat(), e.getPartsTotal(), e.getTotalQuoted(), e.getEstimatedDays(), e.getMinimumCloseAmount(), e.getObservations(), e.getCurrentVersion(), items, e.getAuthorizedByName(), e.getInterestedName(), e.getBenchStraighteningApplies(), e.getBenchStraighteningDetail(), e.getAlignmentApplies(), e.getAlignmentDetail(), e.getBalancingApplies(), e.getBalancingDetail(), e.getGlassReplacementApplies(), e.getGlassReplacementDetail(), e.getElectricalWorkApplies(), e.getElectricalDetail(), e.getMechanicalWorkApplies(), e.getMechanicalWorkCode(), e.getQuotedPartsDate(), e.getQuotedPartsSupplier(), e.getProviderId(), accessoryWorks);
    }

    private String resolveInterestedName(CaseEntity caseEntity) {
        if (caseEntity.getPrincipalCustomerPersonId() == null) {
            return null;
        }
        return personRepository.findById(caseEntity.getPrincipalCustomerPersonId())
                .map(PersonEntity::getNombreMostrar)
                .orElse(null);
    }

    private BudgetItemResponse toBudgetItemResponse(BudgetItemEntity e) {
        return new BudgetItemResponse(e.getId(), e.getBudgetId(), e.getVisualOrder(), e.getAffectedPiece(), e.getTaskCode(), e.getDamageLevelCode(), e.getPartDecisionCode(), e.getActionCode(), e.getRequiresReplacement(), e.getPartValue(), e.getEstimatedHours(), e.getLaborAmount(), e.getActive(), e.getProviderId(), e.getProviderSnapshot());
    }

    private CasePartResponse toCasePartResponse(CasePartEntity e) {
        List<CasePartReconciliationWarningResponse> partWarnings = warningRepository.findByCaseIdAndStateOrderByIdAsc(e.getCaseId(), CasePartReconciliationWarningState.OPEN).stream().filter(warning -> warning.getPartId().equals(e.getId())).map(this::toWarningResponse).toList();
        return new CasePartResponse(e.getId(), e.getCaseId(), e.getBudgetItemId(), e.getDescription(), e.getPartCode(), e.getFinalSupplier(), e.getAuthorizedCode(), e.getStatusCode(), e.getPurchasedByCode(), e.getPaymentStatusCode(), e.getBudgetedPrice(), e.getFinalPrice(), e.getReceivedDate(), e.getUsed(), e.getReturned(), e.getProviderId(), e.getSourceType() == null ? null : e.getSourceType().name(), e.getAccessoryWorkId(), e.getAccessory(), e.getNonCanonical(), partWarnings);
    }

    private CasePartReconciliationWarningResponse toWarningResponse(CasePartReconciliationWarningEntity warning) {
        return new CasePartReconciliationWarningResponse(warning.getId(), warning.getPartId(), warning.getSourceType().name(), warning.getSourceId(), warning.getReason(), warning.getState().name(), warning.getCreatedAt());
    }

    private void applyBudgetProvider(BudgetEntity entity, Long providerId, String supplierText) {
        ProviderEntity provider = resolveActiveProvider(providerId);
        entity.setProviderId(provider == null ? null : provider.getId());
        entity.setQuotedPartsSupplier(provider == null ? blankToNull(supplierText) : provider.getName());
    }

    private void applyBudgetItemProvider(BudgetItemEntity entity, Long providerId) {
        ProviderEntity provider = resolveActiveProvider(providerId);
        entity.setProviderId(provider == null ? null : provider.getId());
        entity.setProviderSnapshot(provider == null ? null : provider.getName());
    }

    private void applyCasePartProvider(CasePartEntity entity, Long providerId, String supplierText) {
        ProviderEntity provider = resolveActiveProvider(providerId);
        entity.setProviderId(provider == null ? null : provider.getId());
        entity.setFinalSupplier(provider == null ? blankToNull(supplierText) : provider.getName());
    }

    private ProviderEntity resolveActiveProvider(Long providerId) {
        if (providerId == null) return null;
        ProviderEntity provider = providerRepository.findById(providerId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el proveedor " + providerId));
        if (!Boolean.TRUE.equals(provider.getActive())) throw new ConflictException("El proveedor esta inactivo: " + providerId);
        return provider;
    }

    private String normalizeCode(String value) { return value == null || value.isBlank() ? null : value.trim().toUpperCase(); }
    private String normalizedOptionalCode(String value) { return value == null || value.isBlank() ? null : normalizeCode(value); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private BigDecimal scale(BigDecimal value) { return value == null ? null : value.setScale(2, RoundingMode.HALF_UP); }
}
