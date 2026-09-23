package com.tallerzapata.backend.application.cleas;

import com.tallerzapata.backend.api.casefile.CaseIncidentResponse;
import com.tallerzapata.backend.api.casefile.CaseIncidentUpdateRequest;
import com.tallerzapata.backend.api.cleas.CleasIncidentResponse;
import com.tallerzapata.backend.api.cleas.CleasIncidentUpsertRequest;
import com.tallerzapata.backend.api.cleas.CleasClosureResponse;
import com.tallerzapata.backend.api.cleas.CleasCompanyFranchisePaymentRequest;
import com.tallerzapata.backend.api.cleas.CleasCompanyPaymentAnnulmentRequest;
import com.tallerzapata.backend.api.cleas.CleasCompanyPaymentRequest;
import com.tallerzapata.backend.api.cleas.CleasCompanyPaymentResponse;
import com.tallerzapata.backend.api.cleas.CleasCompanyPaymentSummaryResponse;
import com.tallerzapata.backend.api.cleas.CleasCustomerFranchisePaymentRequest;
import com.tallerzapata.backend.api.cleas.CleasFranchisePaymentSummaryResponse;
import com.tallerzapata.backend.api.cleas.CleasOrderCreateRequest;
import com.tallerzapata.backend.api.cleas.CleasOrderResponse;
import com.tallerzapata.backend.api.finance.FinancialMovementRetentionRequest;
import com.tallerzapata.backend.api.finance.FinancialMovementRetentionResponse;
import com.tallerzapata.backend.api.insurance.CaseCleasResponse;
import com.tallerzapata.backend.api.insurance.CaseCleasUpsertRequest;
import com.tallerzapata.backend.api.insurance.CaseInsuranceResponse;
import com.tallerzapata.backend.api.insurance.CaseInsuranceUpsertRequest;
import com.tallerzapata.backend.api.insurance.InsuranceProcessingPatchRequest;
import com.tallerzapata.backend.api.insurance.InsuranceProcessingResponse;
import com.tallerzapata.backend.application.casefile.CaseAuditService;
import com.tallerzapata.backend.application.casefile.CaseManagementService;
import com.tallerzapata.backend.application.casefile.cleasstate.CleasEffectiveStateRecalculator;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.insurance.InsuranceService;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.application.vehicle.VehiclePlateNormalizer;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.document.DocumentCategoryRepository;
import com.tallerzapata.backend.infrastructure.persistence.document.DocumentEntity;
import com.tallerzapata.backend.infrastructure.persistence.document.DocumentRelationEntity;
import com.tallerzapata.backend.infrastructure.persistence.document.DocumentRelationRepository;
import com.tallerzapata.backend.infrastructure.persistence.document.DocumentRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseCleasRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseCleasEntity;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseInsuranceRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.InsuranceProcessingRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementEntity;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementRetentionEntity;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementRetentionRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialPaymentMethodRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialRetentionTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.IssuedReceiptRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.data.domain.Sort;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class CleasManagementService {
    private static final String CLEAS_MODULE = "CLEAS";
    private static final String COMPANY_PAYMENT_CANCELLATION_TYPE = "COMPANIA";
    private static final String COMPANY_PAYMENT_DOCUMENT_CATEGORY = "COMPROBANTE_PAGO_CLEAS";
    private static final String CUSTOMER_COMPANY_PAYMENT_DOCUMENT_CATEGORY = "COMPROBANTE_PAGO_CLIENTE_COMPANIA_CLEAS";
    private static final String FINANCIAL_MOVEMENT_ENTITY_TYPE = "MOVIMIENTO_FINANCIERO";
    private final InsuranceService insuranceService;
    private final CaseManagementService caseManagementService;
    private final CaseRepository caseRepository;
    private final CaseTypeRepository caseTypeRepository;
    private final DocumentRepository documentRepository;
    private final DocumentCategoryRepository documentCategoryRepository;
    private final DocumentRelationRepository documentRelationRepository;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService accessControlService;
    private final CaseAuditService caseAuditService;
    private final CaseCleasRepository caseCleasRepository;
    private final CleasClosurePolicy cleasClosurePolicy;
    private final CleasSettlementPolicy cleasSettlementPolicy;
    private final CleasLiquidationPdfService cleasLiquidationPdfService;
    private final CaseInsuranceRepository caseInsuranceRepository;
    private final InsuranceProcessingRepository insuranceProcessingRepository;
    private final FinancialMovementRepository financialMovementRepository;
    private final FinancialMovementRetentionRepository financialMovementRetentionRepository;
    private final FinancialPaymentMethodRepository financialPaymentMethodRepository;
    private final FinancialRetentionTypeRepository financialRetentionTypeRepository;
    private final IssuedReceiptRepository issuedReceiptRepository;
    private final CleasEffectiveStateRecalculator cleasEffectiveStateRecalculator;

    public CleasManagementService(InsuranceService insuranceService, CaseManagementService caseManagementService, CaseRepository caseRepository, CaseTypeRepository caseTypeRepository, DocumentRepository documentRepository, DocumentCategoryRepository documentCategoryRepository, DocumentRelationRepository documentRelationRepository, CurrentUserService currentUserService, CaseAccessControlService accessControlService, CaseAuditService caseAuditService, CaseCleasRepository caseCleasRepository, CleasClosurePolicy cleasClosurePolicy, CleasSettlementPolicy cleasSettlementPolicy, CleasLiquidationPdfService cleasLiquidationPdfService, CaseInsuranceRepository caseInsuranceRepository, InsuranceProcessingRepository insuranceProcessingRepository, FinancialMovementRepository financialMovementRepository, FinancialMovementRetentionRepository financialMovementRetentionRepository, FinancialPaymentMethodRepository financialPaymentMethodRepository, FinancialRetentionTypeRepository financialRetentionTypeRepository, IssuedReceiptRepository issuedReceiptRepository, CleasEffectiveStateRecalculator cleasEffectiveStateRecalculator) {
        this.insuranceService = insuranceService;
        this.caseManagementService = caseManagementService;
        this.caseRepository = caseRepository;
        this.caseTypeRepository = caseTypeRepository;
        this.documentRepository = documentRepository;
        this.documentCategoryRepository = documentCategoryRepository;
        this.documentRelationRepository = documentRelationRepository;
        this.currentUserService = currentUserService;
        this.accessControlService = accessControlService;
        this.caseAuditService = caseAuditService;
        this.caseCleasRepository = caseCleasRepository;
        this.cleasClosurePolicy = cleasClosurePolicy;
        this.cleasSettlementPolicy = cleasSettlementPolicy;
        this.cleasLiquidationPdfService = cleasLiquidationPdfService;
        this.caseInsuranceRepository = caseInsuranceRepository;
        this.insuranceProcessingRepository = insuranceProcessingRepository;
        this.financialMovementRepository = financialMovementRepository;
        this.financialMovementRetentionRepository = financialMovementRetentionRepository;
        this.financialPaymentMethodRepository = financialPaymentMethodRepository;
        this.financialRetentionTypeRepository = financialRetentionTypeRepository;
        this.issuedReceiptRepository = issuedReceiptRepository;
        this.cleasEffectiveStateRecalculator = cleasEffectiveStateRecalculator;
    }

    @Transactional(readOnly = true)
    public CaseCleasResponse getDefinition(Long caseId) { requireCleasCase(caseId); return insuranceService.getCaseCleas(caseId); }

    @Transactional
    public CaseCleasResponse upsertDefinition(Long caseId, CaseCleasUpsertRequest request, HttpServletRequest httpRequest) { requireEditableCleasCase(caseId); CaseCleasResponse response = insuranceService.upsertCaseCleas(caseId, request, httpRequest); cleasEffectiveStateRecalculator.recalculate(caseId); return response; }

    @Transactional(readOnly = true)
    public CaseInsuranceResponse getInsurance(Long caseId) { requireCleasCase(caseId); return insuranceService.getCaseInsurance(caseId); }

    @Transactional
    public CaseInsuranceResponse upsertInsurance(Long caseId, CaseInsuranceUpsertRequest request, HttpServletRequest httpRequest) { requireEditableCleasCase(caseId); return insuranceService.upsertCaseInsurance(caseId, request, httpRequest); }

    @Transactional(readOnly = true)
    public CleasIncidentResponse getIncident(Long caseId) {
        requireCleasCase(caseId);
        CaseIncidentResponse incident = caseManagementService.getCaseIncident(caseId);
        return new CleasIncidentResponse(incident, thirdPartyPlate(caseId));
    }

    @Transactional
    public CleasIncidentResponse upsertIncident(Long caseId, CleasIncidentUpsertRequest request, HttpServletRequest httpRequest) {
        requireEditableCleasCase(caseId);
        if (request.incident() == null) throw new ConflictException("incident es obligatorio");
        var incident = request.incident();
        var normalizedIncident = new CaseIncidentUpdateRequest(
                incident.incidentDate(), incident.incidentTime(), incident.location(), incident.dynamics(), incident.observations(),
                incident.incidentDate() == null ? null : incident.incidentDate().plusYears(1));
        caseManagementService.updateCaseIncident(caseId, normalizedIncident, httpRequest);
        updateThirdPartyPlate(caseId, request.thirdPartyPlate());
        return new CleasIncidentResponse(caseManagementService.getCaseIncident(caseId), thirdPartyPlate(caseId));
    }

    @Transactional(readOnly = true)
    public InsuranceProcessingResponse getProcessing(Long caseId) { requireCleasCase(caseId); return insuranceService.getCaseInsuranceProcessing(caseId); }

    @Transactional
    public InsuranceProcessingResponse patchProcessing(Long caseId, InsuranceProcessingPatchRequest request, HttpServletRequest httpRequest) { requireEditableCleasCase(caseId); InsuranceProcessingResponse response = insuranceService.patchCaseInsuranceProcessing(caseId, request, httpRequest); if (request.has("agreementDate")) cleasEffectiveStateRecalculator.recordAgreement(caseId, request.agreementDate() == null || request.agreementDate().isNull() ? null : LocalDate.parse(request.agreementDate().asText())); else cleasEffectiveStateRecalculator.recalculate(caseId); return response; }

    @Transactional(readOnly = true)
    public List<CleasOrderResponse> listOrders(Long caseId) {
        CaseEntity caseEntity = requireEditableCleasCase(caseId);
        requireAccess(caseEntity, "documento.ver");
        return documentRelationRepository.findByCaseIdOrderByVisualOrderAscIdAsc(caseId).stream()
                .filter(relation -> CLEAS_MODULE.equals(relation.getModuleCode()) && "CASO".equals(relation.getEntityType()) && caseId.equals(relation.getEntityId()))
                .map(this::toOrderResponse)
                .toList();
    }

    @Transactional
    public CleasOrderResponse createOrder(Long caseId, CleasOrderCreateRequest request, HttpServletRequest httpRequest) {
        CaseEntity caseEntity = requireEditableCleasCase(caseId);
        AuthenticatedUser currentUser = requireAccess(caseEntity, "documento.crear");
        DocumentEntity document = documentRepository.findByIdAndActiveTrue(request.documentId()).orElseThrow(() -> new ResourceNotFoundException("No existe el documento " + request.documentId()));
        if (!documentCategoryRepository.findById(document.getCategoryId()).filter(category -> "ORDEN_CLEAS".equals(category.getCode()) && CLEAS_MODULE.equals(category.getModuleCode()) && Boolean.TRUE.equals(category.getActive())).isPresent()) {
            throw new ConflictException("El documento debe usar la categoria ORDEN_CLEAS");
        }
        DocumentRelationEntity relation = documentRelationRepository.findByDocumentIdOrderByVisualOrderAscIdAsc(document.getId()).stream()
                .filter(existing -> caseId.equals(existing.getCaseId()) && "CASO".equals(existing.getEntityType()) && caseId.equals(existing.getEntityId()))
                .findFirst()
                .orElseGet(DocumentRelationEntity::new);
        if (CLEAS_MODULE.equals(relation.getModuleCode())) throw new ConflictException("El documento ya esta relacionado como orden CLEAS");
        relation.setDocumentId(document.getId());
        relation.setCaseId(caseId);
        relation.setEntityType("CASO");
        relation.setEntityId(caseId);
        relation.setModuleCode(CLEAS_MODULE);
        relation.setPrincipal(Boolean.TRUE.equals(request.principal()));
        relation.setVisibleToCustomer(Boolean.TRUE.equals(request.visibleToCustomer()));
        relation.setVisualOrder(request.visualOrder() == null ? 0 : request.visualOrder());
        relation = documentRelationRepository.save(relation);
        caseAuditService.register(currentUser.id(), caseId, "documento_relaciones", relation.getId(), "vincular_orden_cleas", null, caseAuditService.toJson(Map.of("documentId", document.getId())), caseAuditService.toJson(Map.of("domain", CLEAS_MODULE)), httpRequest);
        return toOrderResponse(relation);
    }

    @Transactional
    public void deleteOrder(Long caseId, Long relationId, HttpServletRequest httpRequest) {
        CaseEntity caseEntity = requireEditableCleasCase(caseId);
        AuthenticatedUser currentUser = requireAccess(caseEntity, "documento.crear");
        DocumentRelationEntity relation = documentRelationRepository.findById(relationId).orElseThrow(() -> new ResourceNotFoundException("No existe la relacion documental " + relationId));
        if (!caseId.equals(relation.getCaseId()) || !CLEAS_MODULE.equals(relation.getModuleCode()) || !"CASO".equals(relation.getEntityType())) throw new ConflictException("La orden no pertenece al caso CLEAS indicado");
        documentRelationRepository.delete(relation);
        caseAuditService.register(currentUser.id(), caseId, "documento_relaciones", relationId, "desvincular_orden_cleas", caseAuditService.toJson(Map.of("documentId", relation.getDocumentId())), null, caseAuditService.toJson(Map.of("domain", CLEAS_MODULE)), httpRequest);
    }

    @Transactional
    public CleasClosureResponse close(Long caseId, HttpServletRequest httpRequest) {
        CaseEntity caseEntity = requireCleasCase(caseId);
        AuthenticatedUser currentUser = requireAccess(caseEntity, "seguro.crear");
        if (caseEntity.getClosedAt() != null) throw new ConflictException("El caso CLEAS ya se encuentra cerrado");
        cleasClosurePolicy.requireAdverseTotal(caseCleasRepository.findByCaseId(caseId).orElse(null));
        LocalDateTime closedAt = LocalDateTime.now();
        caseEntity.setClosedAt(closedAt);
        caseRepository.save(caseEntity);
        cleasEffectiveStateRecalculator.recalculate(caseId);
        caseAuditService.register(currentUser.id(), caseId, "casos", caseId, "cerrar_cleas_dictamen_en_contra", null,
                caseAuditService.toJson(Map.of("closedAt", closedAt)), caseAuditService.toJson(Map.of("domain", CLEAS_MODULE)), httpRequest);
        return new CleasClosureResponse(caseId, closedAt);
    }

    @Transactional(readOnly = true)
    public CleasCompanyPaymentSummaryResponse companyPaymentSummary(Long caseId) {
        CaseEntity caseEntity = requireEditableCleasCase(caseId);
        requireAccess(caseEntity, "finanza.ver");
        return companyPaymentSummary(caseEntity);
    }

    @Transactional
    public CleasCompanyPaymentResponse registerCompanyPayment(Long caseId, CleasCompanyPaymentRequest request, HttpServletRequest httpRequest) {
        CaseEntity caseEntity = requireEditableCleasCase(caseId);
        AuthenticatedUser currentUser = requirePaymentAccess(caseEntity, request.retentions());
        CleasCompanyPaymentSummaryResponse summary = companyPaymentSummary(caseEntity);
        BigDecimal grossAmount = money(request.amount());
        if (grossAmount.signum() <= 0) throw new ConflictException("El importe bruto del pago de compania debe ser positivo");
        if (grossAmount.compareTo(summary.pendingGrossAmount()) > 0) throw new ConflictException("El importe bruto supera el saldo pendiente de la compania");
        if (request.paymentMethodCode() == null || !financialPaymentMethodRepository.existsByCodeAndActiveTrue(normalizeCode(request.paymentMethodCode()))) throw new ConflictException("paymentMethodCode no permitido: " + request.paymentMethodCode());
        if (request.receiptId() != null && issuedReceiptRepository.findByIdAndCaseId(request.receiptId(), caseId).isEmpty()) throw new ResourceNotFoundException("No existe el comprobante del caso " + request.receiptId());
        DocumentEntity document = documentRepository.findByIdAndActiveTrue(request.documentId()).orElseThrow(() -> new ResourceNotFoundException("No existe el documento " + request.documentId()));
        if (documentCategoryRepository.findById(document.getCategoryId()).filter(category -> COMPANY_PAYMENT_DOCUMENT_CATEGORY.equals(category.getCode())
                && CLEAS_MODULE.equals(category.getModuleCode()) && caseEntity.getCaseTypeId().equals(category.getCaseTypeId())
                && Boolean.TRUE.equals(category.getActive())).isEmpty()) {
            throw new ConflictException("El documento debe usar la categoria COMPROBANTE_PAGO_CLEAS del caso CLEAS");
        }
        List<FinancialMovementRetentionRequest> retentions = request.retentions() == null ? List.of() : request.retentions();
        BigDecimal retentionsAmount = retentions.stream().map(retention -> money(retention.amount())).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (retentions.stream().anyMatch(retention -> retention.amount() == null || money(retention.amount()).signum() < 0)) throw new ConflictException("Las retenciones no pueden ser negativas");
        if (retentionsAmount.compareTo(grossAmount) > 0) throw new ConflictException("La suma de retenciones no puede superar el importe bruto");
        for (FinancialMovementRetentionRequest retention : retentions) {
            if (!financialRetentionTypeRepository.existsByCodeAndActiveTrue(normalizeCode(retention.retentionTypeCode()))) throw new ConflictException("retentionTypeCode no permitido: " + retention.retentionTypeCode());
        }
        BigDecimal netAmount = grossAmount.subtract(retentionsAmount);

        FinancialMovementEntity movement = new FinancialMovementEntity();
        movement.setCaseId(caseId);
        movement.setReceiptId(request.receiptId());
        movement.setMovementTypeCode("INGRESO");
        movement.setFlowOriginCode("ASEGURADORA");
        movement.setCounterpartyTypeCode("COMPANIA");
        movement.setCounterpartyCompanyId(summary.companyId());
        movement.setMovementAt(request.movementAt() == null ? LocalDateTime.now() : request.movementAt());
        movement.setGrossAmount(grossAmount);
        movement.setNetAmount(netAmount);
        movement.setPaymentMethodCode(normalizeCode(request.paymentMethodCode()));
        movement.setPaymentMethodDetail(blankToNull(request.paymentMethodDetail()));
        movement.setCancellationTypeCode(COMPANY_PAYMENT_CANCELLATION_TYPE);
        movement.setAdvancePayment(false);
        movement.setBonification(false);
        movement.setExternalReference(blankToNull(request.externalReference()));
        movement.setReason(blankToNull(request.reason()) == null ? "Pago CLEAS de compania" : blankToNull(request.reason()));
        movement.setRegisteredBy(currentUser.id());
        movement = financialMovementRepository.saveAndFlush(movement);
        Long movementId = movement.getId();
        List<FinancialMovementRetentionEntity> savedRetentions = retentions.stream().map(retention -> {
            FinancialMovementRetentionEntity entity = new FinancialMovementRetentionEntity();
            entity.setMovementId(movementId);
            entity.setRetentionTypeCode(normalizeCode(retention.retentionTypeCode()));
            entity.setAmount(money(retention.amount()));
            entity.setDetail(blankToNull(retention.detail()));
            return entity;
        }).toList();
        savedRetentions = financialMovementRetentionRepository.saveAll(savedRetentions);
        DocumentRelationEntity documentRelation = new DocumentRelationEntity();
        documentRelation.setDocumentId(document.getId());
        documentRelation.setCaseId(caseId);
        documentRelation.setEntityType(FINANCIAL_MOVEMENT_ENTITY_TYPE);
        documentRelation.setEntityId(movementId);
        documentRelation.setModuleCode(CLEAS_MODULE);
        documentRelation.setPrincipal(Boolean.TRUE);
        documentRelation.setVisibleToCustomer(Boolean.FALSE);
        documentRelation.setVisualOrder(0);
        documentRelation = documentRelationRepository.save(documentRelation);
        caseAuditService.register(currentUser.id(), caseId, "movimientos_financieros", movement.getId(), "registrar_pago_compania_cleas", null,
                caseAuditService.toJson(Map.of("grossAmount", grossAmount, "netAmount", netAmount, "retentionsAmount", retentionsAmount, "documentId", document.getId(), "companyId", summary.companyId(), "movementId", movement.getId())), caseAuditService.toJson(Map.of("domain", CLEAS_MODULE)), httpRequest);
        caseAuditService.register(currentUser.id(), caseId, "documento_relaciones", documentRelation.getId(), "vincular_comprobante_pago_cleas", null,
                caseAuditService.toJson(Map.of("documentId", document.getId(), "movementId", movementId)), caseAuditService.toJson(Map.of("domain", CLEAS_MODULE)), httpRequest);
        List<FinancialMovementRetentionResponse> retentionResponses = savedRetentions.stream().map(retention -> new FinancialMovementRetentionResponse(retention.getId(), retention.getRetentionTypeCode(), retention.getAmount(), retention.getDetail())).toList();
        cleasEffectiveStateRecalculator.recalculate(caseId);
        return new CleasCompanyPaymentResponse(movement.getId(), movement.getPublicId(), grossAmount, movement.getMovementAt(), movement.getPaymentMethodCode(), movement.getPaymentMethodDetail(), movement.getReceiptId(), movement.getExternalReference(), movement.getReason(), grossAmount, retentionsAmount, netAmount, document.getId(), retentionResponses);
    }

    @Transactional
    public CleasCompanyPaymentSummaryResponse annulCompanyPayment(Long caseId, Long movementId, CleasCompanyPaymentAnnulmentRequest request, HttpServletRequest httpRequest) {
        CaseEntity caseEntity = requireEditableCleasCase(caseId);
        AuthenticatedUser currentUser = requireExceptionalFinanceAccess(caseEntity);

        FinancialMovementEntity original = financialMovementRepository.findById(movementId)
                .filter(movement -> caseId.equals(movement.getCaseId()))
                .orElseThrow(() -> new ResourceNotFoundException("No existe el movimiento " + movementId + " del caso CLEAS"));

        if (!"INGRESO".equals(normalizeCode(original.getMovementTypeCode()))
                || !"ASEGURADORA".equals(normalizeCode(original.getFlowOriginCode()))
                || !COMPANY_PAYMENT_CANCELLATION_TYPE.equals(normalizeCode(original.getCancellationTypeCode()))) {
            throw new ConflictException("Solo puede anularse un pago de compania CLEAS");
        }

        boolean alreadyAnnulled = financialMovementRepository.findByCaseId(caseId, Sort.unsorted()).stream()
                .anyMatch(movement -> original.getPublicId() != null && original.getPublicId().equals(movement.getExternalReference()));
        if (alreadyAnnulled) throw new ConflictException("El pago de compania ya fue anulado");

        BigDecimal grossAmount = money(original.getGrossAmount());
        BigDecimal netAmount = money(original.getNetAmount());

        FinancialMovementEntity reversal = new FinancialMovementEntity();
        reversal.setCaseId(caseId);
        reversal.setMovementTypeCode("EGRESO");
        reversal.setFlowOriginCode("ASEGURADORA");
        reversal.setCounterpartyTypeCode("COMPANIA");
        reversal.setCounterpartyCompanyId(original.getCounterpartyCompanyId());
        reversal.setMovementAt(LocalDateTime.now());
        reversal.setGrossAmount(grossAmount);
        reversal.setNetAmount(netAmount);
        reversal.setPaymentMethodCode(original.getPaymentMethodCode());
        reversal.setPaymentMethodDetail(original.getPaymentMethodDetail());
        reversal.setCancellationTypeCode(COMPANY_PAYMENT_CANCELLATION_TYPE);
        reversal.setAdvancePayment(false);
        reversal.setBonification(false);
        reversal.setExternalReference(original.getPublicId());
        String reason = request == null ? null : request.reason();
        reversal.setReason(blankToNull(reason) == null ? "Anulacion de pago CLEAS de compania" : blankToNull(reason));
        reversal.setRegisteredBy(currentUser.id());
        reversal = financialMovementRepository.saveAndFlush(reversal);

        caseAuditService.register(currentUser.id(), caseId, "movimientos_financieros", reversal.getId(), "anular_pago_compania_cleas", null,
                caseAuditService.toJson(Map.of("movementId", movementId, "reversalMovementId", reversal.getId(), "grossAmount", grossAmount, "netAmount", netAmount)), caseAuditService.toJson(Map.of("domain", CLEAS_MODULE)), httpRequest);

        cleasEffectiveStateRecalculator.recalculate(caseId);
        return companyPaymentSummary(caseEntity);
    }

    @Transactional(readOnly = true)
    public byte[] liquidationPdf(Long caseId) {
        CaseEntity caseEntity = requireEditableCleasCase(caseId);
        requireAccess(caseEntity, "finanza.ver");
        return cleasLiquidationPdfService.generate(caseId);
    }

    @Transactional(readOnly = true)
    public CleasFranchisePaymentSummaryResponse franchisePaymentSummary(Long caseId) {
        CaseEntity caseEntity = requireEditableCleasCase(caseId);
        requireAccess(caseEntity, "finanza.ver");
        return franchiseSummary(caseEntity);
    }

    @Transactional
    public CleasFranchisePaymentSummaryResponse registerCustomerFranchisePayment(Long caseId, CleasCustomerFranchisePaymentRequest request, HttpServletRequest httpRequest) {
        CaseEntity caseEntity = requireEditableCleasCase(caseId);
        AuthenticatedUser currentUser = requireAccess(caseEntity, "finanza.pago.crear");
        var cleas = caseCleasRepository.findByCaseId(caseId).orElseThrow(() -> new ConflictException("El caso no tiene definicion CLEAS"));
        if (!"FRANQUICIA".equals(cleas.getScopeCode()) || !"EN_CONTRA".equals(cleas.getOpinionCode())) {
            throw new ConflictException("El pago de franquicia del cliente solo aplica a CLEAS FRANQUICIA con dictamen EN_CONTRA");
        }
        CleasFranchisePaymentSummaryResponse summary = franchiseSummary(caseEntity);
        BigDecimal grossAmount = money(request.amount());
        if (grossAmount.signum() <= 0) throw new ConflictException("El importe del pago de franquicia debe ser positivo");
        if (grossAmount.compareTo(summary.customerPendingAmount()) > 0) throw new ConflictException("El importe supera el saldo pendiente de la franquicia");
        if (request.paymentMethodCode() == null || !financialPaymentMethodRepository.existsByCodeAndActiveTrue(normalizeCode(request.paymentMethodCode()))) throw new ConflictException("paymentMethodCode no permitido: " + request.paymentMethodCode());
        if (request.receiptId() != null && issuedReceiptRepository.findByIdAndCaseId(request.receiptId(), caseId).isEmpty()) throw new ResourceNotFoundException("No existe el comprobante del caso " + request.receiptId());

        FinancialMovementEntity movement = new FinancialMovementEntity();
        movement.setCaseId(caseId);
        movement.setReceiptId(request.receiptId());
        movement.setMovementTypeCode("INGRESO");
        movement.setFlowOriginCode("CLIENTE");
        movement.setCounterpartyTypeCode("PERSONA");
        movement.setCounterpartyPersonId(caseEntity.getPrincipalCustomerPersonId());
        movement.setMovementAt(request.movementAt() == null ? LocalDateTime.now() : request.movementAt());
        movement.setGrossAmount(grossAmount);
        movement.setNetAmount(grossAmount);
        movement.setPaymentMethodCode(normalizeCode(request.paymentMethodCode()));
        movement.setPaymentMethodDetail(blankToNull(request.paymentMethodDetail()));
        movement.setCancellationTypeCode("FRANQUICIA");
        movement.setAdvancePayment(false);
        movement.setBonification(false);
        movement.setExternalReference(blankToNull(request.externalReference()));
        movement.setReason(blankToNull(request.reason()) == null ? "Pago de franquicia CLEAS del cliente" : blankToNull(request.reason()));
        movement.setRegisteredBy(currentUser.id());
        movement = financialMovementRepository.saveAndFlush(movement);

        CleasFranchisePaymentSummaryResponse updated = franchiseSummary(caseEntity);

        caseAuditService.register(currentUser.id(), caseId, "movimientos_financieros", movement.getId(), "registrar_pago_franquicia_cleas", null,
                caseAuditService.toJson(Map.of("grossAmount", grossAmount, "movementId", movement.getId())), caseAuditService.toJson(Map.of("domain", CLEAS_MODULE)), httpRequest);

        cleasEffectiveStateRecalculator.recalculate(caseId);
        return updated;
    }

    @Transactional
    public CleasFranchisePaymentSummaryResponse annulCustomerFranchisePayment(Long caseId, Long movementId, CleasCompanyPaymentAnnulmentRequest request, HttpServletRequest httpRequest) {
        CaseEntity caseEntity = requireEditableCleasCase(caseId);
        AuthenticatedUser currentUser = requireExceptionalFinanceAccess(caseEntity);
        var cleas = caseCleasRepository.findByCaseId(caseId).orElseThrow(() -> new ConflictException("El caso no tiene definicion CLEAS"));
        FinancialMovementEntity original = financialMovementRepository.findById(movementId).filter(item -> caseId.equals(item.getCaseId())).orElseThrow(() -> new ResourceNotFoundException("No existe el pago de franquicia " + movementId));
        if (!"INGRESO".equals(normalizeCode(original.getMovementTypeCode())) || !"CLIENTE".equals(normalizeCode(original.getFlowOriginCode())) || !"FRANQUICIA".equals(normalizeCode(original.getCancellationTypeCode()))) throw new ConflictException("Solo puede anularse un pago de franquicia del cliente");
        boolean alreadyAnnulled = financialMovementRepository.findByCaseId(caseId, Sort.unsorted()).stream().anyMatch(item -> original.getPublicId() != null && original.getPublicId().equals(item.getExternalReference()));
        if (alreadyAnnulled) throw new ConflictException("El pago de franquicia ya fue anulado");
        FinancialMovementEntity reversal = new FinancialMovementEntity();
        reversal.setCaseId(caseId); reversal.setMovementTypeCode("EGRESO"); reversal.setFlowOriginCode("CLIENTE"); reversal.setCounterpartyTypeCode("PERSONA"); reversal.setCounterpartyPersonId(original.getCounterpartyPersonId()); reversal.setMovementAt(LocalDateTime.now()); reversal.setGrossAmount(money(original.getGrossAmount())); reversal.setNetAmount(money(original.getNetAmount())); reversal.setPaymentMethodCode(original.getPaymentMethodCode()); reversal.setCancellationTypeCode("FRANQUICIA"); reversal.setAdvancePayment(false); reversal.setBonification(false); reversal.setExternalReference(original.getPublicId()); reversal.setReason(request == null || blankToNull(request.reason()) == null ? "Anulacion de pago de franquicia CLEAS" : blankToNull(request.reason())); reversal.setRegisteredBy(currentUser.id()); financialMovementRepository.saveAndFlush(reversal);
        CleasFranchisePaymentSummaryResponse updated = franchiseSummary(caseEntity);
        caseAuditService.register(currentUser.id(), caseId, "movimientos_financieros", movementId, "anular_pago_franquicia_cleas", null, caseAuditService.toJson(Map.of("movementId", movementId)), caseAuditService.toJson(Map.of("domain", CLEAS_MODULE)), httpRequest);
        cleasEffectiveStateRecalculator.recalculate(caseId);
        return updated;
    }

    @Transactional
    public CleasFranchisePaymentSummaryResponse registerCompanyFranchisePayment(Long caseId, CleasCompanyFranchisePaymentRequest request, HttpServletRequest httpRequest) {
        CaseEntity caseEntity = requireEditableCleasCase(caseId);
        AuthenticatedUser currentUser = requireAccess(caseEntity, "finanza.pago.crear");
        var cleas = caseCleasRepository.findByCaseId(caseId).orElseThrow(() -> new ConflictException("El caso no tiene definicion CLEAS"));
        if (!"FRANQUICIA".equals(cleas.getScopeCode()) || !"EN_CONTRA".equals(cleas.getOpinionCode())) {
            throw new ConflictException("El pago de franquicia a la compania solo aplica a CLEAS FRANQUICIA con dictamen EN_CONTRA");
        }
        String statusCode = normalizeCode(request.statusCode());
        if (statusCode == null || !List.of("PENDIENTE", "COBRADO", "NO_APLICA").contains(statusCode)) {
            throw new ConflictException("statusCode no permitido: " + request.statusCode());
        }
        cleas.setCompanyFranchisePaymentStatusCode(statusCode);
        cleas.setCompanyFranchisePaymentDate(request.paymentDate());
        caseCleasRepository.save(cleas);
        if (request.documentId() != null) {
            DocumentEntity document = documentRepository.findByIdAndActiveTrue(request.documentId())
                    .orElseThrow(() -> new ResourceNotFoundException("No existe el documento " + request.documentId()));
            if (documentCategoryRepository.findById(document.getCategoryId()).filter(category -> CUSTOMER_COMPANY_PAYMENT_DOCUMENT_CATEGORY.equals(category.getCode())
                    && CLEAS_MODULE.equals(category.getModuleCode()) && Boolean.TRUE.equals(category.getActive())).isEmpty()) {
                throw new ConflictException("El documento debe usar la categoria COMPROBANTE_PAGO_CLIENTE_COMPANIA_CLEAS");
            }
            boolean belongsToAnotherCase = documentRelationRepository.findByDocumentIdOrderByVisualOrderAscIdAsc(document.getId()).stream()
                    .anyMatch(relation -> !caseId.equals(relation.getCaseId()));
            if (belongsToAnotherCase) throw new ConflictException("El comprobante pertenece a otro caso");
            if (!documentRelationRepository.existsByDocumentIdAndEntityTypeAndEntityId(document.getId(), "CASO_CLEAS", cleas.getId())) {
                DocumentRelationEntity relation = new DocumentRelationEntity();
                relation.setDocumentId(document.getId());
                relation.setCaseId(caseId);
                relation.setEntityType("CASO_CLEAS");
                relation.setEntityId(cleas.getId());
                relation.setModuleCode(CLEAS_MODULE);
                relation.setPrincipal(Boolean.FALSE);
                relation.setVisibleToCustomer(Boolean.FALSE);
                relation.setVisualOrder(0);
                documentRelationRepository.save(relation);
            }
        }
        Map<String, Object> paymentAudit = new java.util.LinkedHashMap<>();
        paymentAudit.put("statusCode", statusCode);
        paymentAudit.put("paymentDate", request.paymentDate());
        paymentAudit.put("documentId", request.documentId());
        caseAuditService.register(currentUser.id(), caseId, "caso_cleas", cleas.getId(), "registrar_pago_compania_franquicia_cleas", null,
                caseAuditService.toJson(paymentAudit), caseAuditService.toJson(Map.of("domain", CLEAS_MODULE)), httpRequest);
        cleasEffectiveStateRecalculator.recalculate(caseId);
        return franchiseSummary(caseEntity);
    }

    private CleasFranchisePaymentSummaryResponse franchiseSummary(CaseEntity caseEntity) {
        var cleas = caseCleasRepository.findByCaseId(caseEntity.getId()).orElseThrow(() -> new ConflictException("El caso no tiene definicion CLEAS"));
        BigDecimal agreedAmount = insuranceProcessingRepository.findByCaseId(caseEntity.getId()).map(value -> money(value.getAgreedAmount())).orElse(BigDecimal.ZERO);
        CleasSettlement settlement = cleasSettlementPolicy.settle(cleas, agreedAmount);
        List<FinancialMovementEntity> customerPayments = financialMovementRepository.findByCaseId(caseEntity.getId(), Sort.by(Sort.Order.asc("movementAt"), Sort.Order.asc("id"))).stream()
                .filter(movement -> "CLIENTE".equals(normalizeCode(movement.getFlowOriginCode()))
                        && "FRANQUICIA".equals(normalizeCode(movement.getCancellationTypeCode())))
                .toList();
        BigDecimal customerPaid = customerPayments.stream().map(this::signedNetAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal customerPending = settlement.customerChargeAmount().subtract(customerPaid).max(BigDecimal.ZERO);
        LocalDate customerCollectionDate = null;
        if (settlement.customerChargeAmount().signum() > 0 && customerPending.signum() <= 0) {
            BigDecimal collected = BigDecimal.ZERO;
            for (FinancialMovementEntity payment : customerPayments) {
                collected = collected.add(signedNetAmount(payment));
                if (collected.compareTo(settlement.customerChargeAmount()) >= 0) {
                    customerCollectionDate = payment.getMovementAt().toLocalDate();
                    break;
                }
            }
        }
        String customerCollectionStatus = settlement.customerChargeAmount().signum() <= 0 || customerPending.signum() <= 0 ? "COBRADO" : "PENDIENTE";
        return new CleasFranchisePaymentSummaryResponse(caseEntity.getId(), settlement.franchiseAmount(), settlement.companyRequiredAmount(), settlement.customerChargeAmount(), settlement.amountToBillCompany(), customerPaid, customerPending, customerCollectionStatus, customerCollectionDate, cleas.getCompanyFranchisePaymentStatusCode(), cleas.getCompanyFranchisePaymentDate());
    }

    private void updateThirdPartyPlate(Long caseId, String plate) {
        var cleas = caseCleasRepository.findByCaseId(caseId).orElseGet(() -> {
            var entity = new CaseCleasEntity();
            entity.setCaseId(caseId);
            return entity;
        });
        cleas.setThirdPartyPlate(VehiclePlateNormalizer.normalize(plate));
        caseCleasRepository.save(cleas);
    }

    private String thirdPartyPlate(Long caseId) {
        return caseCleasRepository.findByCaseId(caseId).map(CaseCleasEntity::getThirdPartyPlate).orElse(null);
    }

    private CleasOrderResponse toOrderResponse(DocumentRelationEntity relation) {
        DocumentEntity document = documentRepository.findByIdAndActiveTrue(relation.getDocumentId()).orElseThrow(() -> new ResourceNotFoundException("No existe el documento " + relation.getDocumentId()));
        return new CleasOrderResponse(relation.getId(), document.getId(), document.getPublicId(), document.getFileName(), document.getMimeType(), document.getDocumentDate(), relation.getPrincipal(), relation.getVisibleToCustomer(), relation.getVisualOrder());
    }

    private CaseEntity requireCleasCase(Long caseId) {
        CaseEntity caseEntity = caseRepository.findById(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
        String caseTypeCode = caseTypeRepository.findById(caseEntity.getCaseTypeId()).map(CaseTypeEntity::getCode).orElseThrow(() -> new ResourceNotFoundException("No existe el tipo de tramite del caso " + caseId));
        if (!"CLEAS".equals(caseTypeCode)) throw new ConflictException("La gestion por secciones solo aplica a casos CLEAS");
        return caseEntity;
    }

    private CaseEntity requireEditableCleasCase(Long caseId) {
        CaseEntity caseEntity = requireCleasCase(caseId);
        if (caseEntity.getClosedAt() != null) throw new ConflictException("El caso CLEAS esta cerrado y no admite nuevas acciones");
        return caseEntity;
    }

    private AuthenticatedUser requireAccess(CaseEntity caseEntity, String permission) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        accessControlService.requireCaseAccess(currentUser, caseEntity, permission);
        return currentUser;
    }

    private AuthenticatedUser requirePaymentAccess(CaseEntity caseEntity, List<FinancialMovementRetentionRequest> retentions) {
        if (retentions == null || retentions.isEmpty()) return requireAccess(caseEntity, "finanza.pago.crear");
        AuthenticatedUser currentUser = requireAccess(caseEntity, "finanza.retencion.gestionar");
        if (!accessControlService.hasGlobalScope(currentUser)) throw new com.tallerzapata.backend.application.common.ForbiddenException("Solo un administrador global puede gestionar retenciones");
        return currentUser;
    }

    private AuthenticatedUser requireExceptionalFinanceAccess(CaseEntity caseEntity) {
        AuthenticatedUser currentUser = requireAccess(caseEntity, "finanza.excepcional.modificar");
        if (!accessControlService.hasGlobalScope(currentUser)) throw new com.tallerzapata.backend.application.common.ForbiddenException("Solo un administrador global puede realizar operaciones financieras excepcionales");
        return currentUser;
    }

    private CleasCompanyPaymentSummaryResponse companyPaymentSummary(CaseEntity caseEntity) {
        var cleas = caseCleasRepository.findByCaseId(caseEntity.getId()).orElseThrow(() -> new ConflictException("El caso no tiene definicion CLEAS"));
        boolean eligibleOpinion = "A_FAVOR".equals(cleas.getOpinionCode())
                || ("DANIO_TOTAL".equals(cleas.getScopeCode()) && "CULPA_COMPARTIDA".equals(cleas.getOpinionCode()))
                || ("FRANQUICIA".equals(cleas.getScopeCode()) && "EN_CONTRA".equals(cleas.getOpinionCode()));
        if (!eligibleOpinion) throw new ConflictException("El pago de compania no aplica al dictamen CLEAS actual");
        Long companyId = caseInsuranceRepository.findByCaseId(caseEntity.getId()).map(value -> value.getInsuranceCompanyId())
                .orElseThrow(() -> new ConflictException("El caso no tiene compania aseguradora configurada"));
        BigDecimal agreedAmount = insuranceProcessingRepository.findByCaseId(caseEntity.getId()).map(value -> money(value.getAgreedAmount())).orElse(BigDecimal.ZERO);
        if (agreedAmount.signum() <= 0) throw new ConflictException("No hay un monto acordado de la compania para registrar el pago");
        BigDecimal target = cleasSettlementPolicy.settle(cleas, agreedAmount).amountToBillCompany();
        if (target.signum() <= 0) throw new ConflictException("No hay saldo de compania para registrar el pago");
        List<FinancialMovementEntity> companyPayments = financialMovementRepository.findByCaseId(caseEntity.getId(), Sort.unsorted()).stream()
                .filter(movement -> "ASEGURADORA".equals(normalizeCode(movement.getFlowOriginCode()))
                        && COMPANY_PAYMENT_CANCELLATION_TYPE.equals(normalizeCode(movement.getCancellationTypeCode()))
                        && companyId.equals(movement.getCounterpartyCompanyId()))
                .toList();
        BigDecimal paidNet = companyPayments.stream().map(this::signedNetAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal paidGross = companyPayments.stream().map(this::signedGrossAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal pendingNet = target.subtract(paidNet).max(BigDecimal.ZERO);
        BigDecimal pendingGross = target.subtract(paidGross).max(BigDecimal.ZERO);
        return new CleasCompanyPaymentSummaryResponse(caseEntity.getId(), companyId, target, paidNet, pendingNet, paidGross, pendingGross);
    }

    private BigDecimal signedGrossAmount(FinancialMovementEntity movement) {
        BigDecimal amount = money(movement.getGrossAmount());
        return "INGRESO".equals(normalizeCode(movement.getMovementTypeCode())) || ("AJUSTE".equals(normalizeCode(movement.getMovementTypeCode())) && amount.signum() >= 0) ? amount : amount.negate();
    }

    private BigDecimal signedNetAmount(FinancialMovementEntity movement) {
        BigDecimal amount = money(movement.getNetAmount());
        return "INGRESO".equals(normalizeCode(movement.getMovementTypeCode())) || ("AJUSTE".equals(normalizeCode(movement.getMovementTypeCode())) && amount.signum() >= 0) ? amount : amount.negate();
    }

    private BigDecimal money(BigDecimal value) { return value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP); }
    private String normalizeCode(String value) { return value == null || value.isBlank() ? null : value.trim().toUpperCase(); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
