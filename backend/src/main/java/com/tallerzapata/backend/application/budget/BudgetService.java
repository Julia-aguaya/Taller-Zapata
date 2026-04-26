package com.tallerzapata.backend.application.budget;

import com.tallerzapata.backend.api.budget.*;
import com.tallerzapata.backend.application.casefile.CaseAuditService;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.budget.*;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.InsurancePartsAuthorizationRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

@Service
public class BudgetService {
    private final BudgetRepository budgetRepository;
    private final BudgetItemRepository budgetItemRepository;
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
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService accessControlService;
    private final CaseAuditService caseAuditService;

    public BudgetService(BudgetRepository budgetRepository, BudgetItemRepository budgetItemRepository, CasePartRepository casePartRepository, CaseRepository caseRepository, BudgetReportStatusRepository budgetReportStatusRepository, BudgetTaskRepository budgetTaskRepository, DamageLevelRepository damageLevelRepository, PartDecisionRepository partDecisionRepository, BudgetActionRepository budgetActionRepository, PartStatusRepository partStatusRepository, PartPurchaserRepository partPurchaserRepository, PartPaymentStatusRepository partPaymentStatusRepository, InsurancePartsAuthorizationRepository insurancePartsAuthorizationRepository, CurrentUserService currentUserService, CaseAccessControlService accessControlService, CaseAuditService caseAuditService) {
        this.budgetRepository = budgetRepository;
        this.budgetItemRepository = budgetItemRepository;
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
        this.currentUserService = currentUserService;
        this.accessControlService = accessControlService;
        this.caseAuditService = caseAuditService;
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

    @Transactional
    public BudgetResponse upsertBudget(Long caseId, BudgetUpsertRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
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
        entity.setCurrentVersion(isCreate ? 1 : entity.getCurrentVersion() + 1);
        entity = budgetRepository.save(entity);
        caseAuditService.register(currentUser.id(), caseId, "presupuestos", entity.getId(), "upsert_presupuesto", null, caseAuditService.toJson(Map.of("reportStatusCode", entity.getReportStatusCode(), "totalQuoted", entity.getTotalQuoted())), caseAuditService.toJson(Map.of("domain", "presupuestos")), httpRequest);
        List<BudgetItemResponse> items = budgetItemRepository.findByBudgetIdOrderByVisualOrderAsc(entity.getId()).stream().map(this::toBudgetItemResponse).toList();
        return toBudgetResponse(entity, items);
    }

    @Transactional
    public BudgetResponse closeBudget(Long caseId, BudgetCloseRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "presupuesto.crear");
        if (request.reportStatusCode() != null && !budgetReportStatusRepository.existsByCodeAndActiveTrue(normalizeCode(request.reportStatusCode()))) throw new ConflictException("reportStatusCode no permitido: " + request.reportStatusCode());
        BudgetEntity entity = budgetRepository.findByCaseId(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe presupuesto para el caso " + caseId));
        entity.setReportStatusCode(normalizedOptionalCode(request.reportStatusCode()));
        entity.setObservations(blankToNull(request.observations()));
        entity = budgetRepository.save(entity);
        caseAuditService.register(currentUser.id(), caseId, "presupuestos", entity.getId(), "cerrar_presupuesto", null, caseAuditService.toJson(Map.of("reportStatusCode", entity.getReportStatusCode())), caseAuditService.toJson(Map.of("domain", "presupuestos")), httpRequest);
        List<BudgetItemResponse> items = budgetItemRepository.findByBudgetIdOrderByVisualOrderAsc(entity.getId()).stream().map(this::toBudgetItemResponse).toList();
        return toBudgetResponse(entity, items);
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
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "presupuesto.crear");
        BudgetEntity budget = budgetRepository.findByCaseId(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe presupuesto para el caso " + caseId));
        validateBudgetItemRequest(request);
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
        entity.setActive(true);
        entity = budgetItemRepository.save(entity);
        caseAuditService.register(currentUser.id(), caseId, "presupuesto_items", entity.getId(), "crear_presupuesto_item", null, caseAuditService.toJson(Map.of("affectedPiece", entity.getAffectedPiece(), "taskCode", entity.getTaskCode())), caseAuditService.toJson(Map.of("domain", "presupuestos")), httpRequest);
        return toBudgetItemResponse(entity);
    }

    @Transactional
    public BudgetItemResponse updateBudgetItem(Long caseId, Long itemId, BudgetItemUpdateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
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
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "presupuesto.crear");
        validateCasePartRequest(request);
        if (request.budgetItemId() != null && !budgetItemRepository.existsById(request.budgetItemId())) throw new ResourceNotFoundException("No existe el presupuesto_item " + request.budgetItemId());
        CasePartEntity entity = new CasePartEntity();
        entity.setCaseId(caseId);
        entity.setBudgetItemId(request.budgetItemId());
        entity.setDescription(request.description().trim());
        entity.setPartCode(blankToNull(request.partCode()));
        entity.setFinalSupplier(blankToNull(request.finalSupplier()));
        entity.setAuthorizedCode(normalizedOptionalCode(request.authorizationCode()));
        entity.setStatusCode(normalizeCode(request.statusCode()));
        entity.setPurchasedByCode(normalizedOptionalCode(request.purchasedByCode()));
        entity.setPaymentStatusCode(normalizedOptionalCode(request.paymentStatusCode()));
        entity.setBudgetedPrice(scale(request.budgetedPrice()));
        entity.setFinalPrice(scale(request.finalPrice()));
        entity.setReceivedDate(request.receivedDate());
        entity.setUsed(Boolean.TRUE.equals(request.used()));
        entity.setReturned(Boolean.TRUE.equals(request.returned()));
        entity = casePartRepository.save(entity);
        caseAuditService.register(currentUser.id(), caseId, "repuestos_caso", entity.getId(), "crear_repuesto_caso", null, caseAuditService.toJson(Map.of("description", entity.getDescription(), "statusCode", entity.getStatusCode())), caseAuditService.toJson(Map.of("domain", "presupuestos")), httpRequest);
        return toCasePartResponse(entity);
    }

    @Transactional
    public CasePartResponse updateCasePart(Long caseId, Long partId, CasePartUpdateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "presupuesto.crear");
        CasePartEntity entity = casePartRepository.findById(partId).orElseThrow(() -> new ResourceNotFoundException("No existe el repuesto " + partId));
        if (!entity.getCaseId().equals(caseId)) throw new ConflictException("El repuesto no pertenece al caso indicado");
        validateCasePartUpdateRequest(request);
        if (request.budgetItemId() != null && !budgetItemRepository.existsById(request.budgetItemId())) throw new ResourceNotFoundException("No existe el presupuesto_item " + request.budgetItemId());
        entity.setBudgetItemId(request.budgetItemId());
        entity.setDescription(request.description().trim());
        entity.setPartCode(blankToNull(request.partCode()));
        entity.setFinalSupplier(blankToNull(request.finalSupplier()));
        entity.setAuthorizedCode(normalizedOptionalCode(request.authorizationCode()));
        entity.setStatusCode(normalizeCode(request.statusCode()));
        entity.setPurchasedByCode(normalizedOptionalCode(request.purchasedByCode()));
        entity.setPaymentStatusCode(normalizedOptionalCode(request.paymentStatusCode()));
        entity.setBudgetedPrice(scale(request.budgetedPrice()));
        entity.setFinalPrice(scale(request.finalPrice()));
        entity.setReceivedDate(request.receivedDate());
        entity.setUsed(Boolean.TRUE.equals(request.used()));
        entity.setReturned(Boolean.TRUE.equals(request.returned()));
        entity = casePartRepository.save(entity);
        caseAuditService.register(currentUser.id(), caseId, "repuestos_caso", entity.getId(), "actualizar_repuesto_caso", null, caseAuditService.toJson(Map.of("description", entity.getDescription(), "statusCode", entity.getStatusCode())), caseAuditService.toJson(Map.of("domain", "presupuestos")), httpRequest);
        return toCasePartResponse(entity);
    }

    private void validateBudgetItemRequest(BudgetItemCreateRequest request) {
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

    private BudgetResponse toBudgetResponse(BudgetEntity e, List<BudgetItemResponse> items) {
        return new BudgetResponse(e.getId(), e.getCaseId(), e.getOrganizationId(), e.getBranchId(), e.getBudgetDate(), e.getReportStatusCode(), e.getLaborWithoutVat(), e.getVatRate(), e.getLaborVat(), e.getLaborWithVat(), e.getPartsTotal(), e.getTotalQuoted(), e.getEstimatedDays(), e.getMinimumCloseAmount(), e.getObservations(), e.getCurrentVersion(), items);
    }

    private BudgetItemResponse toBudgetItemResponse(BudgetItemEntity e) {
        return new BudgetItemResponse(e.getId(), e.getBudgetId(), e.getVisualOrder(), e.getAffectedPiece(), e.getTaskCode(), e.getDamageLevelCode(), e.getPartDecisionCode(), e.getActionCode(), e.getRequiresReplacement(), e.getPartValue(), e.getEstimatedHours(), e.getLaborAmount(), e.getActive());
    }

    private CasePartResponse toCasePartResponse(CasePartEntity e) {
        return new CasePartResponse(e.getId(), e.getCaseId(), e.getBudgetItemId(), e.getDescription(), e.getPartCode(), e.getFinalSupplier(), e.getAuthorizedCode(), e.getStatusCode(), e.getPurchasedByCode(), e.getPaymentStatusCode(), e.getBudgetedPrice(), e.getFinalPrice(), e.getReceivedDate(), e.getUsed(), e.getReturned());
    }

    private String normalizeCode(String value) { return value == null || value.isBlank() ? null : value.trim().toUpperCase(); }
    private String normalizedOptionalCode(String value) { return value == null || value.isBlank() ? null : normalizeCode(value); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private BigDecimal scale(BigDecimal value) { return value == null ? null : value.setScale(2, RoundingMode.HALF_UP); }
}
