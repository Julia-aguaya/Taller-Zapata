package com.tallerzapata.backend.application.finance;

import com.tallerzapata.backend.api.finance.*;
import com.tallerzapata.backend.application.casefile.CaseAuditService;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.document.DocumentRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.*;
import com.tallerzapata.backend.infrastructure.persistence.insurance.InsuranceCompanyRepository;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.security.UserRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class FinanceService {
    private static final List<String> SUPPORTED_APPLICATION_ENTITY_TYPES = List.of("CASO", "DOCUMENTO", "EGRESO", "INGRESO");

    private final FinancialMovementRepository movementRepository;
    private final FinancialMovementRetentionRepository retentionRepository;
    private final FinancialMovementApplicationRepository applicationRepository;
    private final IssuedReceiptRepository receiptRepository;
    private final CaseRepository caseRepository;
    private final PersonRepository personRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final FinancialMovementTypeRepository movementTypeRepository;
    private final FinancialFlowOriginRepository flowOriginRepository;
    private final FinancialCounterpartyTypeRepository counterpartyTypeRepository;
    private final FinancialPaymentMethodRepository paymentMethodRepository;
    private final FinancialCancellationTypeRepository cancellationTypeRepository;
    private final FinancialRetentionTypeRepository retentionTypeRepository;
    private final FinancialApplicationConceptRepository applicationConceptRepository;
    private final IssuedReceiptTypeRepository issuedReceiptTypeRepository;
    private final InsuranceCompanyRepository companyRepository;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService accessControlService;
    private final CaseAuditService caseAuditService;

    public FinanceService(FinancialMovementRepository movementRepository, FinancialMovementRetentionRepository retentionRepository, FinancialMovementApplicationRepository applicationRepository, IssuedReceiptRepository receiptRepository, CaseRepository caseRepository, PersonRepository personRepository, UserRepository userRepository, DocumentRepository documentRepository, FinancialMovementTypeRepository movementTypeRepository, FinancialFlowOriginRepository flowOriginRepository, FinancialCounterpartyTypeRepository counterpartyTypeRepository, FinancialPaymentMethodRepository paymentMethodRepository, FinancialCancellationTypeRepository cancellationTypeRepository, FinancialRetentionTypeRepository retentionTypeRepository, FinancialApplicationConceptRepository applicationConceptRepository, IssuedReceiptTypeRepository issuedReceiptTypeRepository, InsuranceCompanyRepository companyRepository, CurrentUserService currentUserService, CaseAccessControlService accessControlService, CaseAuditService caseAuditService) {
        this.movementRepository = movementRepository;
        this.retentionRepository = retentionRepository;
        this.applicationRepository = applicationRepository;
        this.receiptRepository = receiptRepository;
        this.caseRepository = caseRepository;
        this.personRepository = personRepository;
        this.userRepository = userRepository;
        this.documentRepository = documentRepository;
        this.movementTypeRepository = movementTypeRepository;
        this.flowOriginRepository = flowOriginRepository;
        this.counterpartyTypeRepository = counterpartyTypeRepository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.cancellationTypeRepository = cancellationTypeRepository;
        this.retentionTypeRepository = retentionTypeRepository;
        this.applicationConceptRepository = applicationConceptRepository;
        this.issuedReceiptTypeRepository = issuedReceiptTypeRepository;
        this.companyRepository = companyRepository;
        this.currentUserService = currentUserService;
        this.accessControlService = accessControlService;
        this.caseAuditService = caseAuditService;
    }

    @Transactional(readOnly = true)
    public List<FinancialMovementResponse> listMovementsByCase(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "finanza.ver");
        return movementRepository.findByCaseId(caseId, Sort.by(Sort.Order.desc("movementAt"), Sort.Order.desc("id"))).stream().map(this::toMovementResponse).toList();
    }

    @Transactional
    public FinancialMovementResponse createMovement(Long caseId, FinancialMovementCreateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "finanza.crear");
        validateMovementRequest(request);

        FinancialMovementEntity entity = new FinancialMovementEntity();
        entity.setCaseId(caseId);
        entity.setReceiptId(request.receiptId());
        entity.setMovementTypeCode(normalizeCode(request.movementTypeCode()));
        entity.setFlowOriginCode(normalizeCode(request.flowOriginCode()));
        entity.setCounterpartyTypeCode(normalizeCode(request.counterpartyTypeCode()));
        entity.setCounterpartyPersonId(request.counterpartyPersonId());
        entity.setCounterpartyCompanyId(request.counterpartyCompanyId());
        entity.setMovementAt(request.movementAt());
        entity.setGrossAmount(scale(request.grossAmount()));
        entity.setNetAmount(scale(request.netAmount()));
        entity.setPaymentMethodCode(normalizeCode(request.paymentMethodCode()));
        entity.setPaymentMethodDetail(blankToNull(request.paymentMethodDetail()));
        entity.setCancellationTypeCode(normalizedOptionalCode(request.cancellationTypeCode()));
        entity.setAdvancePayment(Boolean.TRUE.equals(request.advancePayment()));
        entity.setBonification(Boolean.TRUE.equals(request.bonification()));
        entity.setReason(blankToNull(request.reason()));
        entity.setExternalReference(blankToNull(request.externalReference()));
        entity.setRegisteredBy(currentUser.id());
        entity = movementRepository.save(entity);

        saveRetentions(entity.getId(), request.retentions());
        saveApplications(entity.getId(), caseId, request.applications());

        caseAuditService.register(currentUser.id(), caseId, "movimientos_financieros", entity.getId(), "crear_movimiento_financiero", null, caseAuditService.toJson(movementSnapshot(entity)), caseAuditService.toJson(Map.of("domain", "finanzas")), httpRequest);
        return toMovementResponse(entity);
    }

    @Transactional(readOnly = true)
    public List<IssuedReceiptResponse> listReceiptsByCase(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "finanza.ver");
        return receiptRepository.findByCaseId(caseId, Sort.by(Sort.Order.desc("issuedDate"), Sort.Order.desc("id"))).stream().map(this::toReceiptResponse).toList();
    }

    @Transactional
    public IssuedReceiptResponse createReceipt(Long caseId, IssuedReceiptCreateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "finanza.crear");
        validateReceiptRequest(request);

        IssuedReceiptEntity entity = new IssuedReceiptEntity();
        entity.setCaseId(caseId);
        entity.setReceiptTypeCode(normalizeCode(request.receiptTypeCode()));
        entity.setReceiptNumber(request.receiptNumber().trim());
        entity.setReceiverBusinessName(request.receiverBusinessName().trim());
        entity.setIssuedDate(request.issuedDate());
        entity.setTaxableNet(scale(request.taxableNet()));
        entity.setVatAmount(scale(request.vatAmount()));
        entity.setTotal(scale(request.total()));
        entity.setSignedAt(request.signedAt());
        entity.setNotes(blankToNull(request.notes()));
        entity.setDocumentId(request.documentId());
        entity = receiptRepository.save(entity);

        caseAuditService.register(currentUser.id(), caseId, "comprobantes_emitidos", entity.getId(), "crear_comprobante_emitido", null, caseAuditService.toJson(Map.of("receiptTypeCode", entity.getReceiptTypeCode(), "total", entity.getTotal())), caseAuditService.toJson(Map.of("domain", "finanzas")), httpRequest);
        return toReceiptResponse(entity);
    }

    @Transactional(readOnly = true)
    public FinanceCaseSummaryResponse summarizeCase(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "finanza.ver");

        List<FinancialMovementEntity> movements = movementRepository.findByCaseId(caseId, Sort.unsorted());
        BigDecimal ingresos = BigDecimal.ZERO;
        BigDecimal egresos = BigDecimal.ZERO;
        BigDecimal totalRetenciones = BigDecimal.ZERO;
        BigDecimal totalAplicado = BigDecimal.ZERO;

        for (FinancialMovementEntity movement : movements) {
            BigDecimal net = scale(movement.getNetAmount());
            if ("INGRESO".equals(movement.getMovementTypeCode()) || ("AJUSTE".equals(movement.getMovementTypeCode()) && net.signum() >= 0)) {
                ingresos = ingresos.add(net);
            } else {
                egresos = egresos.add(net.abs());
            }
            totalRetenciones = totalRetenciones.add(retentionRepository.findByMovementIdOrderByIdAsc(movement.getId()).stream().map(item -> scale(item.getAmount())).reduce(BigDecimal.ZERO, BigDecimal::add));
            totalAplicado = totalAplicado.add(applicationRepository.findByMovementIdOrderByIdAsc(movement.getId()).stream().map(item -> scale(item.getAppliedAmount())).reduce(BigDecimal.ZERO, BigDecimal::add));
        }

        return new FinanceCaseSummaryResponse(caseId, ingresos, egresos, ingresos.subtract(egresos), totalRetenciones, totalAplicado);
    }

    @Transactional
    public List<FinancialMovementRetentionResponse> addRetentions(Long movementId, List<FinancialMovementRetentionRequest> requests, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        FinancialMovementEntity movement = movementRepository.findById(movementId).orElseThrow(() -> new ResourceNotFoundException("No existe el movimiento " + movementId));
        CaseEntity caseEntity = requireCase(movement.getCaseId());
        accessControlService.requireCaseAccess(currentUser, caseEntity, "finanza.crear");
        for (FinancialMovementRetentionRequest request : requests) {
            if (!retentionTypeRepository.existsByCodeAndActiveTrue(normalizeCode(request.retentionTypeCode()))) throw new ConflictException("retentionTypeCode no permitido: " + request.retentionTypeCode());
        }
        List<FinancialMovementRetentionEntity> entities = requests.stream().map(request -> {
            FinancialMovementRetentionEntity entity = new FinancialMovementRetentionEntity();
            entity.setMovementId(movementId);
            entity.setRetentionTypeCode(normalizeCode(request.retentionTypeCode()));
            entity.setAmount(scale(request.amount()));
            entity.setDetail(blankToNull(request.detail()));
            return entity;
        }).toList();
        List<FinancialMovementRetentionEntity> saved = retentionRepository.saveAll(entities);
        caseAuditService.register(currentUser.id(), caseEntity.getId(), "movimientos_financieros", movementId, "crear_retenciones_movimiento", null, caseAuditService.toJson(Map.of("count", saved.size())), caseAuditService.toJson(Map.of("domain", "finanzas")), httpRequest);
        return saved.stream().map(item -> new FinancialMovementRetentionResponse(item.getId(), item.getRetentionTypeCode(), item.getAmount(), item.getDetail())).toList();
    }

    @Transactional
    public List<FinancialMovementApplicationResponse> addApplications(Long movementId, List<FinancialMovementApplicationRequest> requests, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        FinancialMovementEntity movement = movementRepository.findById(movementId).orElseThrow(() -> new ResourceNotFoundException("No existe el movimiento " + movementId));
        CaseEntity caseEntity = requireCase(movement.getCaseId());
        accessControlService.requireCaseAccess(currentUser, caseEntity, "finanza.crear");
        for (FinancialMovementApplicationRequest request : requests) {
            if (!applicationConceptRepository.existsByCodeAndActiveTrue(normalizeCode(request.conceptCode()))) throw new ConflictException("conceptCode no permitido: " + request.conceptCode());
            if (!SUPPORTED_APPLICATION_ENTITY_TYPES.contains(normalizeCode(request.entityType()))) throw new ConflictException("entityType no soportado para finanzas: " + request.entityType());
        }
        List<FinancialMovementApplicationEntity> entities = requests.stream().map(request -> {
            FinancialMovementApplicationEntity entity = new FinancialMovementApplicationEntity();
            entity.setMovementId(movementId);
            entity.setCaseId(caseEntity.getId());
            entity.setConceptCode(normalizeCode(request.conceptCode()));
            entity.setEntityType(normalizeCode(request.entityType()));
            entity.setEntityId(request.entityId());
            entity.setAppliedAmount(scale(request.appliedAmount()));
            return entity;
        }).toList();
        List<FinancialMovementApplicationEntity> saved = applicationRepository.saveAll(entities);
        caseAuditService.register(currentUser.id(), caseEntity.getId(), "movimientos_financieros", movementId, "crear_aplicaciones_movimiento", null, caseAuditService.toJson(Map.of("count", saved.size())), caseAuditService.toJson(Map.of("domain", "finanzas")), httpRequest);
        return saved.stream().map(item -> new FinancialMovementApplicationResponse(item.getId(), item.getConceptCode(), item.getEntityType(), item.getEntityId(), item.getAppliedAmount())).toList();
    }

    private void validateMovementRequest(FinancialMovementCreateRequest request) {
        if (!movementTypeRepository.existsByCodeAndActiveTrue(normalizeCode(request.movementTypeCode()))) throw new ConflictException("movementTypeCode no permitido: " + request.movementTypeCode());
        if (!flowOriginRepository.existsByCodeAndActiveTrue(normalizeCode(request.flowOriginCode()))) throw new ConflictException("flowOriginCode no permitido: " + request.flowOriginCode());
        if (!counterpartyTypeRepository.existsByCodeAndActiveTrue(normalizeCode(request.counterpartyTypeCode()))) throw new ConflictException("counterpartyTypeCode no permitido: " + request.counterpartyTypeCode());
        if (!paymentMethodRepository.existsByCodeAndActiveTrue(normalizeCode(request.paymentMethodCode()))) throw new ConflictException("paymentMethodCode no permitido: " + request.paymentMethodCode());
        if (request.cancellationTypeCode() != null && !cancellationTypeRepository.existsByCodeAndActiveTrue(normalizeCode(request.cancellationTypeCode()))) throw new ConflictException("cancellationTypeCode no permitido: " + request.cancellationTypeCode());
        if (request.receiptId() != null && !receiptRepository.existsById(request.receiptId())) throw new ResourceNotFoundException("No existe el comprobante " + request.receiptId());
        if (request.counterpartyPersonId() != null && !personRepository.existsById(request.counterpartyPersonId())) throw new ResourceNotFoundException("No existe la persona contraparte " + request.counterpartyPersonId());
        if (request.counterpartyCompanyId() != null && !companyRepository.existsById(request.counterpartyCompanyId())) throw new ResourceNotFoundException("No existe la compania contraparte " + request.counterpartyCompanyId());
        String normalizedCounterpartyType = normalizeCode(request.counterpartyTypeCode());
        if ("COMPANIA".equals(normalizedCounterpartyType) && request.counterpartyCompanyId() == null) throw new ConflictException("counterpartyCompanyId es obligatorio cuando counterpartyTypeCode es COMPANIA");
        if ("PERSONA".equals(normalizedCounterpartyType) && request.counterpartyPersonId() == null) throw new ConflictException("counterpartyPersonId es obligatorio cuando counterpartyTypeCode es PERSONA");
        if (request.netAmount().compareTo(request.grossAmount()) > 0) throw new ConflictException("netAmount no puede superar grossAmount");
        if (request.retentions() != null) {
            for (FinancialMovementRetentionRequest retention : request.retentions()) {
                if (!retentionTypeRepository.existsByCodeAndActiveTrue(normalizeCode(retention.retentionTypeCode()))) throw new ConflictException("retentionTypeCode no permitido: " + retention.retentionTypeCode());
            }
        }
        if (request.applications() != null) {
            for (FinancialMovementApplicationRequest app : request.applications()) {
                if (!applicationConceptRepository.existsByCodeAndActiveTrue(normalizeCode(app.conceptCode()))) throw new ConflictException("conceptCode no permitido: " + app.conceptCode());
                if (!SUPPORTED_APPLICATION_ENTITY_TYPES.contains(normalizeCode(app.entityType()))) throw new ConflictException("entityType no soportado para finanzas: " + app.entityType());
            }
        }
    }

    private void validateReceiptRequest(IssuedReceiptCreateRequest request) {
        if (!issuedReceiptTypeRepository.existsByCodeAndActiveTrue(normalizeCode(request.receiptTypeCode()))) throw new ConflictException("receiptTypeCode no permitido: " + request.receiptTypeCode());
        if (request.documentId() != null && documentRepository.findByIdAndActiveTrue(request.documentId()).isEmpty()) throw new ResourceNotFoundException("No existe el documento " + request.documentId());
        if (scale(request.taxableNet()).add(scale(request.vatAmount())).compareTo(scale(request.total())) != 0) throw new ConflictException("total debe ser igual a taxableNet + vatAmount");
    }

    private void saveRetentions(Long movementId, List<FinancialMovementRetentionRequest> requests) {
        if (requests == null) return;
        for (FinancialMovementRetentionRequest request : requests) {
            FinancialMovementRetentionEntity entity = new FinancialMovementRetentionEntity();
            entity.setMovementId(movementId);
            entity.setRetentionTypeCode(normalizeCode(request.retentionTypeCode()));
            entity.setAmount(scale(request.amount()));
            entity.setDetail(blankToNull(request.detail()));
            retentionRepository.save(entity);
        }
    }

    private void saveApplications(Long movementId, Long caseId, List<FinancialMovementApplicationRequest> requests) {
        if (requests == null) return;
        for (FinancialMovementApplicationRequest request : requests) {
            FinancialMovementApplicationEntity entity = new FinancialMovementApplicationEntity();
            entity.setMovementId(movementId);
            entity.setCaseId(caseId);
            entity.setConceptCode(normalizeCode(request.conceptCode()));
            entity.setEntityType(normalizeCode(request.entityType()));
            entity.setEntityId(request.entityId());
            entity.setAppliedAmount(scale(request.appliedAmount()));
            applicationRepository.save(entity);
        }
    }

    private CaseEntity requireCase(Long caseId) {
        return caseRepository.findById(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
    }

    private FinancialMovementResponse toMovementResponse(FinancialMovementEntity entity) {
        return new FinancialMovementResponse(entity.getId(), entity.getPublicId(), entity.getCaseId(), entity.getReceiptId(), entity.getMovementTypeCode(), entity.getFlowOriginCode(), entity.getCounterpartyTypeCode(), entity.getCounterpartyPersonId(), entity.getCounterpartyCompanyId(), entity.getMovementAt(), entity.getGrossAmount(), entity.getNetAmount(), entity.getPaymentMethodCode(), entity.getPaymentMethodDetail(), entity.getCancellationTypeCode(), entity.getAdvancePayment(), entity.getBonification(), entity.getReason(), entity.getExternalReference(), entity.getRegisteredBy(), entity.getCreatedAt(), entity.getUpdatedAt(), retentionRepository.findByMovementIdOrderByIdAsc(entity.getId()).stream().map(item -> new FinancialMovementRetentionResponse(item.getId(), item.getRetentionTypeCode(), item.getAmount(), item.getDetail())).toList(), applicationRepository.findByMovementIdOrderByIdAsc(entity.getId()).stream().map(item -> new FinancialMovementApplicationResponse(item.getId(), item.getConceptCode(), item.getEntityType(), item.getEntityId(), item.getAppliedAmount())).toList());
    }

    private IssuedReceiptResponse toReceiptResponse(IssuedReceiptEntity entity) {
        return new IssuedReceiptResponse(entity.getId(), entity.getPublicId(), entity.getCaseId(), entity.getReceiptTypeCode(), entity.getReceiptNumber(), entity.getReceiverBusinessName(), entity.getIssuedDate(), entity.getTaxableNet(), entity.getVatAmount(), entity.getTotal(), entity.getSignedAt(), entity.getNotes(), entity.getDocumentId(), entity.getCreatedAt(), entity.getUpdatedAt());
    }

    private Map<String, Object> movementSnapshot(FinancialMovementEntity entity) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("movementTypeCode", entity.getMovementTypeCode());
        snapshot.put("flowOriginCode", entity.getFlowOriginCode());
        snapshot.put("grossAmount", entity.getGrossAmount());
        snapshot.put("netAmount", entity.getNetAmount());
        snapshot.put("counterpartyTypeCode", entity.getCounterpartyTypeCode());
        return snapshot;
    }

    private BigDecimal scale(BigDecimal value) { return value.setScale(2, RoundingMode.HALF_UP); }
    private String normalizeCode(String value) { return value == null || value.isBlank() ? null : value.trim().toUpperCase(); }
    private String normalizedOptionalCode(String value) { return value == null || value.isBlank() ? null : normalizeCode(value); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
