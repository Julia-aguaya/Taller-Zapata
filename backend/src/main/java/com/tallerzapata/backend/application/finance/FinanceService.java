package com.tallerzapata.backend.application.finance;

import com.tallerzapata.backend.api.finance.*;
import com.tallerzapata.backend.application.casefile.CaseAuditService;
import com.tallerzapata.backend.application.casefile.InsuranceRepairCasePolicy;
import com.tallerzapata.backend.application.casefile.ParticularCaseClosureService;
import com.tallerzapata.backend.application.casefile.particular.ParticularEffectiveStateRecalculator;
import com.tallerzapata.backend.application.casefile.todoriskstate.TodoRiesgoEffectiveStateRecalculator;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.extrabudget.ExtraBudgetPaymentApplicationRepository;
import com.tallerzapata.backend.infrastructure.persistence.extrabudget.ExtraBudgetRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseFranchiseRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseInsuranceRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.InsuranceProcessingRepository;
import com.tallerzapata.backend.infrastructure.persistence.document.DocumentRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.*;
import com.tallerzapata.backend.infrastructure.persistence.insurance.InsuranceCompanyRepository;
import com.tallerzapata.backend.infrastructure.persistence.organization.BranchEntity;
import com.tallerzapata.backend.infrastructure.persistence.organization.BranchRepository;
import com.tallerzapata.backend.infrastructure.persistence.organization.OrganizationEntity;
import com.tallerzapata.backend.infrastructure.persistence.organization.OrganizationRepository;
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
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class FinanceService {
    private final InsuranceRepairCasePolicy insuranceRepairCasePolicy = new InsuranceRepairCasePolicy();
    private static final List<String> SUPPORTED_APPLICATION_ENTITY_TYPES = List.of("CASO", "DOCUMENTO", "EGRESO", "INGRESO");

    private final FinancialMovementRepository movementRepository;
    private final FinancialMovementRetentionRepository retentionRepository;
    private final FinancialMovementApplicationRepository applicationRepository;
    private final IssuedReceiptRepository receiptRepository;
    private final ExtraBudgetRepository extraBudgetRepository;
    private final ExtraBudgetPaymentApplicationRepository extraBudgetPaymentApplications;
    private final CaseFranchiseRepository caseFranchiseRepository;
    private final CaseInsuranceRepository caseInsuranceRepository;
    private final InsuranceProcessingRepository insuranceProcessingRepository;
    private final BudgetRepository budgetRepository;
    private final CaseRepository caseRepository;
    private final CaseTypeRepository caseTypeRepository;
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
    private final OrganizationRepository organizationRepository;
    private final BranchRepository branchRepository;
    private final ReceiptPdfService receiptPdfService;
    private final ClientPaymentPdfService clientPaymentPdfService;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService accessControlService;
    private final CaseAuditService caseAuditService;
    private final ParticularCaseClosureService particularCaseClosureService;
    private final ParticularEffectiveStateRecalculator particularEffectiveStateRecalculator;
    private final TodoRiesgoEffectiveStateRecalculator todoRiesgoEffectiveStateRecalculator;

    public FinanceService(FinancialMovementRepository movementRepository, FinancialMovementRetentionRepository retentionRepository, FinancialMovementApplicationRepository applicationRepository, IssuedReceiptRepository receiptRepository, ExtraBudgetRepository extraBudgetRepository, ExtraBudgetPaymentApplicationRepository extraBudgetPaymentApplications, CaseFranchiseRepository caseFranchiseRepository, CaseInsuranceRepository caseInsuranceRepository, InsuranceProcessingRepository insuranceProcessingRepository, BudgetRepository budgetRepository, CaseRepository caseRepository, CaseTypeRepository caseTypeRepository, PersonRepository personRepository, UserRepository userRepository, DocumentRepository documentRepository, FinancialMovementTypeRepository movementTypeRepository, FinancialFlowOriginRepository flowOriginRepository, FinancialCounterpartyTypeRepository counterpartyTypeRepository, FinancialPaymentMethodRepository paymentMethodRepository, FinancialCancellationTypeRepository cancellationTypeRepository, FinancialRetentionTypeRepository retentionTypeRepository, FinancialApplicationConceptRepository applicationConceptRepository, IssuedReceiptTypeRepository issuedReceiptTypeRepository, InsuranceCompanyRepository companyRepository, OrganizationRepository organizationRepository, BranchRepository branchRepository, ReceiptPdfService receiptPdfService, ClientPaymentPdfService clientPaymentPdfService, CurrentUserService currentUserService, CaseAccessControlService accessControlService, CaseAuditService caseAuditService, ParticularCaseClosureService particularCaseClosureService, ParticularEffectiveStateRecalculator particularEffectiveStateRecalculator, TodoRiesgoEffectiveStateRecalculator todoRiesgoEffectiveStateRecalculator) {
        this.movementRepository = movementRepository;
        this.retentionRepository = retentionRepository;
        this.applicationRepository = applicationRepository;
        this.receiptRepository = receiptRepository;
        this.extraBudgetRepository = extraBudgetRepository;
        this.extraBudgetPaymentApplications = extraBudgetPaymentApplications;
        this.caseFranchiseRepository = caseFranchiseRepository;
        this.caseInsuranceRepository = caseInsuranceRepository;
        this.insuranceProcessingRepository = insuranceProcessingRepository;
        this.budgetRepository = budgetRepository;
        this.caseRepository = caseRepository;
        this.caseTypeRepository = caseTypeRepository;
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
        this.organizationRepository = organizationRepository;
        this.branchRepository = branchRepository;
        this.receiptPdfService = receiptPdfService;
        this.clientPaymentPdfService = clientPaymentPdfService;
        this.currentUserService = currentUserService;
        this.accessControlService = accessControlService;
        this.caseAuditService = caseAuditService;
        this.particularCaseClosureService = particularCaseClosureService;
        this.particularEffectiveStateRecalculator = particularEffectiveStateRecalculator;
        this.todoRiesgoEffectiveStateRecalculator = todoRiesgoEffectiveStateRecalculator;
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
        requireFranchiseMovementAllowed(caseEntity, request);
        requireCompanyPaymentAllowed(caseEntity, request);

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
        particularCaseClosureService.syncClosure(caseId);
        particularEffectiveStateRecalculator.recalculate(caseId);
        if ("ASEGURADORA".equals(entity.getFlowOriginCode())) {
            todoRiesgoEffectiveStateRecalculator.recordPaymentFact(caseId,
                    insurerPaidInFull(caseEntity) ? entity.getMovementAt().toLocalDate() : null,
                    currentUser.id());
        } else {
            todoRiesgoEffectiveStateRecalculator.recalculate(caseId);
        }
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
        validateReceiptRequest(caseEntity, request);
        if (request.fiscalTypeCode() != null && receiptRepository.existsByFiscalTypeCodeAndSalePointAndFiscalNumber(normalizeFiscalType(request.fiscalTypeCode()), normalizeSalePoint(request.salePoint()), normalizeFiscalNumber(request.fiscalNumber()))) throw new ConflictException("Ya existe un comprobante con ese tipo fiscal, punto de venta y número");
        if (request.fiscalTypeCode() == null && receiptRepository.existsByReceiptTypeCodeAndReceiptNumber(normalizeCode(request.receiptTypeCode()), request.receiptNumber().trim())) throw new ConflictException("Ya existe un comprobante con ese tipo y número");

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
        entity.setComprobanteFiscal(blankToNull(request.comprobanteFiscal()));
        entity.setFiscalTypeCode(normalizeFiscalType(request.fiscalTypeCode()));
        entity.setSalePoint(normalizeSalePoint(request.salePoint()));
        entity.setFiscalNumber(normalizeFiscalNumber(request.fiscalNumber()));
        entity.setDocumentId(request.documentId());
        entity.setOriginalReceiptId(request.originalReceiptId());
        entity = receiptRepository.save(entity);

        caseAuditService.register(currentUser.id(), caseId, "comprobantes_emitidos", entity.getId(), "crear_comprobante_emitido", null, caseAuditService.toJson(Map.of("receiptTypeCode", entity.getReceiptTypeCode(), "total", entity.getTotal())), caseAuditService.toJson(Map.of("domain", "finanzas")), httpRequest);
        particularEffectiveStateRecalculator.recalculate(caseId);
        todoRiesgoEffectiveStateRecalculator.recalculate(caseId);
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

    @Transactional(readOnly = true)
    public FinanceParticularSummaryResponse summarizeParticularCase(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "finanza.ver");

        BudgetEntity budget = budgetRepository.findByCaseId(caseId).orElse(null);
        BigDecimal quotedTotal = budget == null ? BigDecimal.ZERO : scale(budget.getTotalQuoted());
        BigDecimal customerPaid = BigDecimal.ZERO;
        boolean hasAdvancePayment = false;
        LocalDateTime paidInFullAt = null;

        List<FinancialMovementEntity> movements = movementRepository.findByCaseId(caseId, Sort.by(Sort.Order.asc("movementAt"), Sort.Order.asc("id")));
        for (FinancialMovementEntity movement : movements) {
            if (!"CLIENTE".equals(normalizeCode(movement.getFlowOriginCode()))) {
                continue;
            }
            if ("TRABAJOS_EXTRAS".equals(normalizeCode(movement.getCancellationTypeCode()))) {
                continue;
            }

            BigDecimal amount = scale(movement.getNetAmount());
            String movementTypeCode = normalizeCode(movement.getMovementTypeCode());
            if ("INGRESO".equals(movementTypeCode) || ("AJUSTE".equals(movementTypeCode) && amount.signum() >= 0)) {
                customerPaid = customerPaid.add(amount);
            } else {
                customerPaid = customerPaid.subtract(amount.abs());
            }

            if (Boolean.TRUE.equals(movement.getAdvancePayment())) {
                hasAdvancePayment = true;
            }

            if (paidInFullAt == null && customerPaid.compareTo(quotedTotal) >= 0 && quotedTotal.compareTo(BigDecimal.ZERO) > 0) {
                paidInFullAt = movement.getMovementAt();
            }
        }

        BigDecimal pendingBalance = quotedTotal.subtract(customerPaid);
        if (pendingBalance.signum() < 0) {
            pendingBalance = BigDecimal.ZERO;
        }

        return new FinanceParticularSummaryResponse(
                caseId,
                quotedTotal,
                customerPaid,
                pendingBalance,
                hasAdvancePayment,
                paidInFullAt != null,
                paidInFullAt
        );
    }

    @Transactional(readOnly = true)
    public FinancePaymentBreakdownResponse paymentBreakdown(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "finanza.ver");

        boolean granizo = isGranizo(caseEntity);
        BigDecimal franchise = granizo ? BigDecimal.ZERO : caseFranchiseRepository.findByCaseId(caseId)
                .filter(value -> !"PROPIA_CIA".equals(normalizeCode(value.getRecoveryTypeCode())))
                .map(value -> money(value.getFranchiseAmount())).orElse(BigDecimal.ZERO);
        BigDecimal extrasTotal = extraBudgetRepository.findByCaseId(caseId)
                .map(value -> money(value.getAcceptedDebtAmount())).orElse(BigDecimal.ZERO);
        BigDecimal extrasPaid = extraBudgetRepository.findByCaseId(caseId)
                .map(value -> money(extraBudgetPaymentApplications.sumAppliedAmountByExtraBudgetId(value.getId()))).orElse(BigDecimal.ZERO);
        BigDecimal franchisePaid = signedPayments(caseId, "CLIENTE", "FRANQUICIA");
        BigDecimal franchisePending = franchise.subtract(franchisePaid).max(BigDecimal.ZERO);
        BigDecimal extrasPending = extrasTotal.subtract(extrasPaid).max(BigDecimal.ZERO);

        BigDecimal agreement = insuranceProcessingRepository.findByCaseId(caseId)
                .map(value -> money(value.getAgreedAmount())).orElse(BigDecimal.ZERO);
        Long companyId = caseInsuranceRepository.findByCaseId(caseId).map(value -> value.getInsuranceCompanyId()).orElse(null);
        BigDecimal insurerTotal = granizo || "PROPIA_CIA".equals(caseFranchiseRepository.findByCaseId(caseId).map(value -> normalizeCode(value.getRecoveryTypeCode())).orElse(null))
                ? agreement : agreement.subtract(franchise).max(BigDecimal.ZERO);
        BigDecimal insurerPaid = signedPaymentsByOrigin(caseId, "ASEGURADORA");

        return new FinancePaymentBreakdownResponse(caseId,
                new FinancePaymentBreakdownResponse.Client(franchise, franchisePaid, franchisePending, extrasTotal, extrasPaid, extrasPending, franchise.add(extrasTotal), franchisePaid.add(extrasPaid), franchisePending.add(extrasPending)),
                new FinancePaymentBreakdownResponse.Insurer(companyId, agreement, franchise, insurerTotal, insurerPaid, insurerTotal.subtract(insurerPaid).max(BigDecimal.ZERO)));
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

    @Transactional(readOnly = true)
    public byte[] getClientPaymentPdf(Long caseId, String clientName, String vehiclePlate, String comprobanteTipo, BigDecimal totalCotizado, String observaciones, String facturaRazonSocial, String facturaNumero) {
        CaseEntity caseEntity = caseRepository.findById(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
        List<FinancialMovementEntity> movements = movementRepository.findByCaseId(caseId, Sort.by(Sort.Order.asc("movementAt")));
        OrganizationEntity org = organizationRepository.findAll().stream().findFirst().orElse(null);
        BranchEntity branch = org != null ? branchRepository.findByOrganizationIdOrderByNameAsc(org.getId()).stream().findFirst().orElse(null) : null;
        return clientPaymentPdfService.generate(caseEntity, clientName, vehiclePlate, comprobanteTipo, totalCotizado, movements, observaciones, facturaRazonSocial, facturaNumero, org, branch);
    }

    @Transactional(readOnly = true)
    public byte[] getReceiptPdf(Long receiptId) {
        IssuedReceiptEntity receipt = receiptRepository.findById(receiptId).orElseThrow(() -> new ResourceNotFoundException("Recibo no encontrado: " + receiptId));
        CaseEntity caseEntity = caseRepository.findById(receipt.getCaseId()).orElse(null);
        OrganizationEntity org = organizationRepository.findAll().stream().findFirst().orElse(null);
        BranchEntity branch = org != null ? branchRepository.findByOrganizationIdOrderByNameAsc(org.getId()).stream().findFirst().orElse(null) : null;
        return receiptPdfService.generate(receipt, caseEntity, org, branch);
    }

    private void validateReceiptRequest(CaseEntity caseEntity, IssuedReceiptCreateRequest request) {
        if (!issuedReceiptTypeRepository.existsByCodeAndActiveTrue(normalizeCode(request.receiptTypeCode()))) throw new ConflictException("receiptTypeCode no permitido: " + request.receiptTypeCode());
        if (request.documentId() != null && documentRepository.findByIdAndActiveTrue(request.documentId()).isEmpty()) throw new ResourceNotFoundException("No existe el documento " + request.documentId());
        if (scale(request.taxableNet()).add(scale(request.vatAmount())).compareTo(scale(request.total())) != 0) throw new ConflictException("total debe ser igual a taxableNet + vatAmount");
        boolean hasFiscalIdentity = request.fiscalTypeCode() != null || request.salePoint() != null || request.fiscalNumber() != null;
        if (hasFiscalIdentity) {
            String fiscalType = normalizeFiscalType(request.fiscalTypeCode());
            String salePoint = normalizeSalePoint(request.salePoint());
            String fiscalNumber = normalizeFiscalNumber(request.fiscalNumber());
            if (fiscalType == null || salePoint == null || fiscalNumber == null) throw new ConflictException("Tipo fiscal, punto de venta y número fiscal son obligatorios juntos");
            if (!List.of("A", "B", "C", "M", "E").contains(fiscalType)) throw new ConflictException("tipo fiscal no permitido: " + request.fiscalTypeCode());
            if (!request.receiptNumber().trim().equals(salePoint + "-" + fiscalNumber)) throw new ConflictException("receiptNumber debe coincidir con punto de venta y número fiscal");
        }
        if ("NOTA_CREDITO".equals(normalizeCode(request.receiptTypeCode()))) {
            if (request.originalReceiptId() == null) throw new ConflictException("La nota de crédito debe indicar una factura original");
            IssuedReceiptEntity original = receiptRepository.findById(request.originalReceiptId()).orElseThrow(() -> new ConflictException("La nota de crédito debe indicar una factura original"));
            if (!"FACTURA".equals(original.getReceiptTypeCode())) throw new ConflictException("La nota de crédito solo puede aplicarse a una factura");
            if (!original.getCaseId().equals(caseEntity.getId())) throw new ConflictException("La nota de crédito debe vincular una factura del mismo caso");
            if (original.getFiscalTypeCode() != null && !original.getFiscalTypeCode().equals(normalizeFiscalType(request.fiscalTypeCode()))) throw new ConflictException("La nota de crédito debe conservar el tipo fiscal de la factura original");
            if (original.getSalePoint() != null && !original.getSalePoint().equals(normalizeSalePoint(request.salePoint()))) throw new ConflictException("La nota de crédito debe conservar el punto de venta de la factura original");
            BigDecimal credited = receiptRepository.findByOriginalReceiptId(original.getId()).stream().map(item -> scale(item.getTotal())).reduce(BigDecimal.ZERO, BigDecimal::add);
            if (credited.add(scale(request.total())).compareTo(scale(original.getTotal())) > 0) throw new ConflictException("La nota de crédito supera el saldo de la factura original");
        } else if (request.originalReceiptId() != null) throw new ConflictException("Solo una nota de crédito puede vincular una factura original");
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

    private boolean isGranizo(CaseEntity caseEntity) {
        return caseTypeRepository.findById(caseEntity.getCaseTypeId())
                .map(type -> insuranceRepairCasePolicy.isGranizo(type.getCode()))
                .orElse(false);
    }

    private void requireFranchiseMovementAllowed(CaseEntity caseEntity, FinancialMovementCreateRequest request) {
        if (!"FRANQUICIA".equals(normalizeCode(request.cancellationTypeCode()))) return;
        if (isGranizo(caseEntity)) {
            throw new ConflictException("Franquicia no aplica a casos GRANIZO");
        }
        if (!isTodoRiesgo(caseEntity)) {
            throw new ConflictException("Franquicia solo aplica a casos TODO_RIESGO");
        }
        if (!"CLIENTE".equals(normalizeCode(request.flowOriginCode()))
                || !"PERSONA".equals(normalizeCode(request.counterpartyTypeCode()))
                || !caseEntity.getPrincipalCustomerPersonId().equals(request.counterpartyPersonId())) {
            throw new ConflictException("La franquicia debe registrarse para el cliente principal");
        }
        BigDecimal agreement = insuranceProcessingRepository.findByCaseId(caseEntity.getId())
                .map(value -> money(value.getAgreedAmount())).orElse(BigDecimal.ZERO);
        if (agreement.signum() <= 0) {
            throw new ConflictException("No hay un monto acordado de la compania para registrar el pago");
        }

        BigDecimal amount = money(request.netAmount());
        if (money(request.grossAmount()).signum() <= 0 || amount.signum() <= 0) {
            throw new ConflictException("El monto de franquicia debe ser mayor a 0");
        }
        String movementType = normalizeCode(request.movementTypeCode());
        if (!"INGRESO".equals(movementType) && !"EGRESO".equals(movementType)) {
            throw new ConflictException("La franquicia solo admite ingresos o anulaciones");
        }
        if ("INGRESO".equals(movementType) && amount.compareTo(franchisePending(caseEntity)) > 0) {
            throw new ConflictException("El pago no puede superar la franquicia pendiente");
        }
    }

    private boolean isTodoRiesgo(CaseEntity caseEntity) {
        return caseTypeRepository.findById(caseEntity.getCaseTypeId())
                .map(type -> "TODO_RIESGO".equals(normalizeCode(type.getCode())))
                .orElse(false);
    }

    private void requireCompanyPaymentAllowed(CaseEntity caseEntity, FinancialMovementCreateRequest request) {
        if (!"COMPANIA".equals(normalizeCode(request.cancellationTypeCode()))) return;
        if (!"ASEGURADORA".equals(normalizeCode(request.flowOriginCode()))
                || !"COMPANIA".equals(normalizeCode(request.counterpartyTypeCode()))) {
            throw new ConflictException("El pago de compania debe registrarse para la aseguradora");
        }

        Long selectedCompanyId = caseInsuranceRepository.findByCaseId(caseEntity.getId())
                .map(value -> value.getInsuranceCompanyId())
                .orElseThrow(() -> new ConflictException("El caso no tiene compania aseguradora configurada"));
        if (!selectedCompanyId.equals(request.counterpartyCompanyId())) {
            throw new ConflictException("El pago debe registrarse para la compania aseguradora del caso");
        }

        BigDecimal amount = money(request.netAmount());
        String movementType = normalizeCode(request.movementTypeCode());
        if ("INGRESO".equals(movementType)) {
            BigDecimal agreement = insuranceProcessingRepository.findByCaseId(caseEntity.getId())
                    .map(value -> money(value.getAgreedAmount())).orElse(BigDecimal.ZERO);
            if (agreement.signum() <= 0) {
                throw new ConflictException("No hay un monto acordado de la compania para registrar el pago");
            }
            if (amount.signum() <= 0 || money(request.grossAmount()).signum() <= 0) {
                throw new ConflictException("El monto del pago de compania debe ser mayor a 0");
            }
            if (amount.compareTo(insurerPending(caseEntity)) > 0) {
                throw new ConflictException("El pago no puede superar el saldo pendiente de la compania");
            }
        }
    }

    private BigDecimal franchisePending(CaseEntity caseEntity) {
        BigDecimal franchise = caseFranchiseRepository.findByCaseId(caseEntity.getId())
                .filter(value -> !"PROPIA_CIA".equals(normalizeCode(value.getRecoveryTypeCode())))
                .map(value -> money(value.getFranchiseAmount()))
                .orElse(BigDecimal.ZERO);
        return franchise.subtract(signedPayments(caseEntity.getId(), "CLIENTE", "FRANQUICIA")).max(BigDecimal.ZERO);
    }

    private BigDecimal insurerPending(CaseEntity caseEntity) {
        BigDecimal agreement = insuranceProcessingRepository.findByCaseId(caseEntity.getId())
                .map(value -> money(value.getAgreedAmount())).orElse(BigDecimal.ZERO);
        BigDecimal target = insuranceRepairCasePolicy.companyPaymentTarget(
                caseTypeRepository.findById(caseEntity.getCaseTypeId()).map(type -> type.getCode()).orElse(""),
                agreement,
                caseFranchiseRepository.findByCaseId(caseEntity.getId()).orElse(null));
        return target.subtract(signedPaymentsByOrigin(caseEntity.getId(), "ASEGURADORA")).max(BigDecimal.ZERO);
    }

    private boolean insurerPaidInFull(CaseEntity caseEntity) {
        BigDecimal agreement = insuranceProcessingRepository.findByCaseId(caseEntity.getId())
                .map(value -> money(value.getAgreedAmount())).orElse(BigDecimal.ZERO);
        if (agreement.signum() <= 0) return false;
        BigDecimal target = insuranceRepairCasePolicy.companyPaymentTarget(
                caseTypeRepository.findById(caseEntity.getCaseTypeId()).map(type -> type.getCode()).orElse(""),
                agreement,
                caseFranchiseRepository.findByCaseId(caseEntity.getId()).orElse(null));
        return signedPaymentsByOrigin(caseEntity.getId(), "ASEGURADORA").compareTo(target) >= 0;
    }

    private BigDecimal signedPaymentsByOrigin(Long caseId, String origin) {
        return movementRepository.findByCaseId(caseId, Sort.unsorted()).stream()
                .filter(movement -> origin.equals(normalizeCode(movement.getFlowOriginCode())))
                .map(movement -> {
                    BigDecimal amount = money(movement.getNetAmount());
                    return "INGRESO".equals(normalizeCode(movement.getMovementTypeCode())) || ("AJUSTE".equals(normalizeCode(movement.getMovementTypeCode())) && amount.signum() >= 0)
                            ? amount : amount.negate();
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal signedPayments(Long caseId, String origin, String concept) {
        return movementRepository.findByCaseId(caseId, Sort.unsorted()).stream()
                .filter(movement -> origin.equals(normalizeCode(movement.getFlowOriginCode())) && concept.equals(normalizeCode(movement.getCancellationTypeCode())))
                .map(movement -> {
                    BigDecimal amount = money(movement.getNetAmount());
                    return "INGRESO".equals(normalizeCode(movement.getMovementTypeCode())) || ("AJUSTE".equals(normalizeCode(movement.getMovementTypeCode())) && amount.signum() >= 0)
                            ? amount : amount.negate();
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private FinancialMovementResponse toMovementResponse(FinancialMovementEntity entity) {
        return new FinancialMovementResponse(entity.getId(), entity.getPublicId(), entity.getCaseId(), entity.getReceiptId(), entity.getMovementTypeCode(), entity.getFlowOriginCode(), entity.getCounterpartyTypeCode(), entity.getCounterpartyPersonId(), entity.getCounterpartyCompanyId(), entity.getMovementAt(), entity.getGrossAmount(), entity.getNetAmount(), entity.getPaymentMethodCode(), entity.getPaymentMethodDetail(), entity.getCancellationTypeCode(), entity.getAdvancePayment(), entity.getBonification(), entity.getReason(), entity.getExternalReference(), entity.getRegisteredBy(), entity.getCreatedAt(), entity.getUpdatedAt(), retentionRepository.findByMovementIdOrderByIdAsc(entity.getId()).stream().map(item -> new FinancialMovementRetentionResponse(item.getId(), item.getRetentionTypeCode(), item.getAmount(), item.getDetail())).toList(), applicationRepository.findByMovementIdOrderByIdAsc(entity.getId()).stream().map(item -> new FinancialMovementApplicationResponse(item.getId(), item.getConceptCode(), item.getEntityType(), item.getEntityId(), item.getAppliedAmount())).toList());
    }

    private IssuedReceiptResponse toReceiptResponse(IssuedReceiptEntity entity) {
        return new IssuedReceiptResponse(entity.getId(), entity.getPublicId(), entity.getCaseId(), entity.getReceiptTypeCode(), entity.getReceiptNumber(), entity.getReceiverBusinessName(), entity.getIssuedDate(), entity.getTaxableNet(), entity.getVatAmount(), entity.getTotal(), entity.getComprobanteFiscal(), entity.getSignedAt(), entity.getNotes(), entity.getDocumentId(), entity.getOriginalReceiptId(), entity.getFiscalTypeCode(), entity.getSalePoint(), entity.getFiscalNumber(), entity.getCreatedAt(), entity.getUpdatedAt());
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
    private BigDecimal money(BigDecimal value) { return value == null ? BigDecimal.ZERO : scale(value); }
    private String normalizeCode(String value) { return value == null || value.isBlank() ? null : value.trim().toUpperCase(); }
    private String normalizedOptionalCode(String value) { return value == null || value.isBlank() ? null : normalizeCode(value); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private String normalizeFiscalType(String value) { return blankToNull(value) == null ? null : value.trim().toUpperCase(); }
    private String normalizeSalePoint(String value) { return value == null || !value.matches("\\d{4}") ? null : value; }
    private String normalizeFiscalNumber(String value) { return value == null || !value.matches("\\d{8}") ? null : value; }
}
