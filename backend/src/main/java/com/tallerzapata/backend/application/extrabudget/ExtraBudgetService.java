package com.tallerzapata.backend.application.extrabudget;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tallerzapata.backend.api.extrabudget.ExtraBudgetDraftRequest;
import com.tallerzapata.backend.api.extrabudget.ExtraBudgetActivationRequest;
import com.tallerzapata.backend.api.extrabudget.ExtraBudgetItemRequest;
import com.tallerzapata.backend.api.extrabudget.ExtraBudgetPaymentAnnulmentRequest;
import com.tallerzapata.backend.api.extrabudget.ExtraBudgetPaymentRequest;
import com.tallerzapata.backend.api.extrabudget.ExtraBudgetResponse;
import com.tallerzapata.backend.api.extrabudget.ExtraBudgetTransitionRequest;
import com.tallerzapata.backend.application.casefile.CaseAuditService;
import com.tallerzapata.backend.application.budget.BudgetComparisonService;
import com.tallerzapata.backend.application.casefile.todoriskstate.TodoRiesgoEffectiveStateRecalculator;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.DomainConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetAccessoryWorkEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetAccessoryWorkRepository;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetRepository;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartRepository;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartSourceType;
import com.tallerzapata.backend.infrastructure.persistence.budget.PartSupplierQuoteRepository;
import com.tallerzapata.backend.infrastructure.persistence.budget.ProviderAssignmentOrigin;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CasePersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.extrabudget.*;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementEntity;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialPaymentMethodRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.IssuedReceiptRepository;
import com.tallerzapata.backend.infrastructure.persistence.organization.BranchRepository;
import com.tallerzapata.backend.infrastructure.persistence.organization.OrganizationRepository;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Service
public class ExtraBudgetService {
    private static final String V66_ACCESSORY_WORK = "V66_ACCESSORY_WORK";
    private final ExtraBudgetRepository budgets;
    private final ExtraBudgetVersionRepository versions;
    private final ExtraBudgetItemRepository items;
    private final ExtraBudgetEventRepository events;
    private final ExtraBudgetPaymentApplicationRepository applications;
    private final ExtraBudgetBranchSequenceRepository sequences;
    private final FinancialMovementRepository movements;
    private final FinancialPaymentMethodRepository paymentMethods;
    private final IssuedReceiptRepository receipts;
    private final CaseRepository cases;
    private final CaseTypeRepository caseTypes;
    private final BudgetRepository mainBudgets;
    private final BudgetAccessoryWorkRepository accessoryWorks;
    private final CasePersonRepository casePersons;
    private final PersonRepository people;
    private final VehicleRepository vehicles;
    private final OrganizationRepository organizations;
    private final BranchRepository branches;
    private final CurrentUserService currentUser;
    private final CaseAccessControlService access;
    private final CaseAuditService audit;
    private final ObjectMapper objectMapper;
    private final ExtraBudgetPdfService pdf;
    private final CasePartRepository caseParts;
    private final PartSupplierQuoteRepository partQuotes;
    private final TodoRiesgoEffectiveStateRecalculator repairState;
    private final BudgetComparisonService comparisons;

    public ExtraBudgetService(ExtraBudgetRepository budgets, ExtraBudgetVersionRepository versions,
                              ExtraBudgetItemRepository items, ExtraBudgetEventRepository events,
                              ExtraBudgetPaymentApplicationRepository applications, ExtraBudgetBranchSequenceRepository sequences,
                                FinancialMovementRepository movements, FinancialPaymentMethodRepository paymentMethods, IssuedReceiptRepository receipts,
                                CaseRepository cases, CaseTypeRepository caseTypes, CasePersonRepository casePersons, PersonRepository people,
                               VehicleRepository vehicles, BudgetRepository mainBudgets, BudgetAccessoryWorkRepository accessoryWorks,
                              OrganizationRepository organizations, BranchRepository branches, CurrentUserService currentUser,
                               CaseAccessControlService access, CaseAuditService audit, ObjectMapper objectMapper,
                               ExtraBudgetPdfService pdf, CasePartRepository caseParts, PartSupplierQuoteRepository partQuotes,
                                TodoRiesgoEffectiveStateRecalculator repairState, BudgetComparisonService comparisons) {
        this.budgets = budgets; this.versions = versions; this.items = items; this.events = events;
        this.applications = applications; this.sequences = sequences; this.movements = movements;
        this.paymentMethods = paymentMethods; this.receipts = receipts; this.cases = cases; this.caseTypes = caseTypes; this.casePersons = casePersons;
        this.people = people; this.vehicles = vehicles;
        this.mainBudgets = mainBudgets; this.accessoryWorks = accessoryWorks;
        this.organizations = organizations; this.branches = branches; this.currentUser = currentUser;
        this.access = access; this.audit = audit; this.objectMapper = objectMapper; this.pdf = pdf;
        this.caseParts = caseParts; this.partQuotes = partQuotes; this.repairState = repairState; this.comparisons = comparisons;
    }

    @Transactional(readOnly = true)
    public ExtraBudgetResponse get(Long caseId) {
        AuthenticatedUser user = currentUser.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        access.requireCaseAccess(user, caseEntity, "presupuesto.ver");
        requireExtraBudgetSupported(caseEntity);
        ExtraBudgetEntity header = budgets.findByCaseId(caseId).orElse(null);
        if (header == null) return inactiveResponse(caseId);
        return response(header);
    }

    @Transactional
    public ExtraBudgetResponse saveDraft(Long caseId, ExtraBudgetDraftRequest request, HttpServletRequest requestContext) {
        AuthenticatedUser user = currentUser.requireCurrentUser();
        CaseEntity caseEntity = requireCaseForUpdate(caseId);
        access.requireCaseAccess(user, caseEntity, "presupuesto.crear");
        requireExtraBudgetSupported(caseEntity);
        ExtraBudgetEntity header = budgets.findByCaseIdForUpdate(caseId).orElseGet(() -> newHeader(caseEntity));
        if (header.getId() != null) assertExpected(header, request.expectedVersion());
        else if (request.expectedVersion() != null) throw new ConflictException("No existe todavía una versión de presupuesto extra para el caso");
        if (header.getId() != null && !Boolean.TRUE.equals(header.getActive())) return response(header);
        ExtraBudgetVersionEntity version;
        if (header.getId() == null) {
            header = budgets.saveAndFlush(header);
            version = newVersion(header, 1);
            version = versions.saveAndFlush(version);
            if (Boolean.TRUE.equals(header.getActive())) {
                applyDraftDetails(version, request);
                saveDraftItems(caseEntity, version, request.items());
            }
            record(header, version, "CREAR_BORRADOR", user.id(), null);
        } else {
            version = currentVersion(header);
            if (version.getStatus() != ExtraBudgetStatus.BORRADOR) throw new ConflictException("Sólo puede editarse la versión BORRADOR actual");
            if (Boolean.TRUE.equals(header.getActive())) {
                applyDraftDetails(version, request);
                saveDraftItems(caseEntity, version, request.items());
            }
            record(header, version, "ACTUALIZAR_BORRADOR", user.id(), null);
        }
        advanceVersionLock(header);
        audit(user, caseId, header, "guardar_presupuesto_extra", requestContext);
        return response(header);
    }

    @Transactional
    public ExtraBudgetResponse setActivation(Long caseId, ExtraBudgetActivationRequest request, HttpServletRequest requestContext) {
        AuthenticatedUser user = currentUser.requireCurrentUser();
        CaseEntity caseEntity = requireCaseForUpdate(caseId);
        access.requireCaseAccess(user, caseEntity, "presupuesto.crear");
        requireExtraBudgetSupported(caseEntity);
        if (request.active() == null) throw new ConflictException("Debe indicar si tiene trabajos extras");

        ExtraBudgetEntity header = budgets.findByCaseIdForUpdate(caseId).orElse(null);
        if (header == null) {
            if (!request.active()) return inactiveResponse(caseId);
            if (request.expectedVersion() != null) throw new ConflictException("No existe todavía una versión de presupuesto extra para el caso");
            header = budgets.saveAndFlush(newHeader(caseEntity));
            ExtraBudgetVersionEntity version = versions.saveAndFlush(newVersion(header, 1));
            createEmptyCanonicalItem(version);
            record(header, version, "ACTIVAR", user.id(), null);
        } else {
            assertExpected(header, request.expectedVersion());
            if (!request.active() && Boolean.TRUE.equals(header.getActive())) {
                ActivationState state = activationState(header);
                if (state.requiresConfirmation() && !Boolean.TRUE.equals(request.confirmDeactivation())) {
                    throw new ConflictException("La desactivación requiere confirmación porque existen datos de trabajos extras");
                }
                requireCleanReversal(caseId);
                removeCleanPromotedParts(caseId);
                header.setActive(false);
                header.setReversedAt(LocalDateTime.now());
                header.setReversedBy(user.id());
                header.setReversalReason("DESACTIVACION");
                record(header, currentVersion(header), "DESACTIVAR", user.id(), null);
            } else if (request.active() && !Boolean.TRUE.equals(header.getActive())) {
                header.setActive(true);
                if (!hasSubstantiveData(header)) createEmptyCanonicalItem(currentVersion(header));
                record(header, currentVersion(header), "ACTIVAR", user.id(), null);
            }
        }
        budgets.saveAndFlush(header);
        audit(user, caseId, header, "actualizar_activacion_presupuesto_extra", requestContext);
        return response(header);
    }

    @Transactional
    public ExtraBudgetResponse present(Long caseId, ExtraBudgetTransitionRequest request, HttpServletRequest requestContext) {
        return transition(caseId, request, ExtraBudgetStatus.PRESENTADO, requestContext);
    }

    @Transactional
    public ExtraBudgetResponse accept(Long caseId, ExtraBudgetTransitionRequest request, HttpServletRequest requestContext) {
        return confirm(caseId, new ExtraBudgetTransitionRequest(request.expectedVersion(), "SI", request.reason()), requestContext);
    }

    @Transactional
    public ExtraBudgetResponse reject(Long caseId, ExtraBudgetTransitionRequest request, HttpServletRequest requestContext) {
        return confirm(caseId, new ExtraBudgetTransitionRequest(request.expectedVersion(), "NO", request.reason()), requestContext);
    }

    @Transactional
    public ExtraBudgetResponse confirm(Long caseId, ExtraBudgetTransitionRequest request, HttpServletRequest requestContext) {
        AuthenticatedUser user = currentUser.requireCurrentUser();
        CaseEntity caseEntity = requireCaseForUpdate(caseId);
        access.requireCaseAccess(user, caseEntity, "presupuesto.crear");
        requireExtraBudgetSupported(caseEntity);
        ExtraBudgetEntity header = requireHeaderForUpdate(caseId);
        assertExpected(header, request.expectedVersion());
        ExtraBudgetVersionEntity version = currentVersion(header);
        String confirmation = normalizeConfirmation(request.confirmation());
        if (paid(header).signum() > 0) throw new ConflictException("No puede confirmarse ni revertirse un presupuesto extra con pagos aplicados");
        if ("SI".equals(confirmation)) {
            if ("SI".equals(header.getCustomerConfirmation()) && version.getStatus() == ExtraBudgetStatus.ACEPTADO) {
                promote(caseId, version, user, requestContext);
                repairState.recalculate(caseId);
                return response(header);
            }
            if (version.getStatus() != ExtraBudgetStatus.PRESENTADO) throw new ConflictException("La confirmación requiere la versión PRESENTADO actual");
            promote(caseId, version, user, requestContext);
            version.setStatus(ExtraBudgetStatus.ACEPTADO);
            version.setAcceptedAt(LocalDateTime.now()); version.setAcceptedBy(user.id());
            header.setAcceptedVersionId(version.getId()); header.setAcceptedDebtAmount(version.getTotal()); header.setCurrentStatus(ExtraBudgetStatus.ACEPTADO);
            header.setCustomerConfirmation("SI"); header.setConfirmedAt(LocalDateTime.now()); header.setConfirmedBy(user.id());
            record(header, version, "CONFIRMAR_SI", user.id(), null);
        } else {
            if ("SI".equals(header.getCustomerConfirmation())) {
                requireCleanReversal(caseId, version);
                removeCleanPromotedParts(caseId, version);
            }
            header.setCustomerConfirmation(confirmation); header.setConfirmedAt(LocalDateTime.now()); header.setConfirmedBy(user.id());
            record(header, version, "CONFIRMAR_" + confirmation, user.id(), request.reason() == null ? null : json(Map.of("reason", request.reason())));
        }
        version.setConfirmedAt(header.getConfirmedAt()); version.setConfirmedBy(user.id());
        versions.save(version); budgets.saveAndFlush(header);
        audit(user, caseId, header, "confirmar_presupuesto_extra", requestContext);
        repairState.recalculate(caseId);
        return response(header);
    }

    @Transactional
    public ExtraBudgetResponse deactivate(Long caseId, ExtraBudgetTransitionRequest request, HttpServletRequest requestContext) {
        return setActivation(caseId, new ExtraBudgetActivationRequest(request.expectedVersion(), false, false), requestContext);
    }

    @Transactional
    public ExtraBudgetResponse revise(Long caseId, ExtraBudgetTransitionRequest request, HttpServletRequest requestContext) {
        AuthenticatedUser user = currentUser.requireCurrentUser();
        CaseEntity caseEntity = requireCaseForUpdate(caseId);
        access.requireCaseAccess(user, caseEntity, "presupuesto.crear");
        requireExtraBudgetSupported(caseEntity);
        ExtraBudgetEntity header = requireHeaderForUpdate(caseId);
        assertExpected(header, request.expectedVersion());
        BigDecimal paid = paid(header);
        if (!ExtraBudgetLifecycle.canRevise(header.getCurrentStatus(), paid)) throw new ConflictException("Sólo puede revisarse un presupuesto extra aceptado sin pagos");
        ExtraBudgetVersionEntity previous = currentVersion(header);
        ExtraBudgetVersionEntity revision = newVersion(header, header.getCurrentVersion() + 1);
        revision = versions.saveAndFlush(revision);
        List<ExtraBudgetItemRequest> copied = items.findByExtraBudgetVersionIdOrderByVisualOrderAsc(previous.getId()).stream()
                .map(item -> new ExtraBudgetItemRequest(item.getVisualOrder(), item.getDescription(), item.getQuantity(), item.getPartUnitAmount(), item.getLaborUnitAmount(), null, null)).toList();
        replaceManualItems(revision, copied);
        revision.setGeneralLaborAmount(previous.getGeneralLaborAmount());
        revision.setGeneralLaborVatApplies(previous.getGeneralLaborVatApplies());
        revision.setNotes(previous.getNotes());
        refreshTotals(revision);
        header.setCurrentVersion(revision.getVersionNumber());
        header.setCurrentStatus(ExtraBudgetStatus.BORRADOR);
        budgets.saveAndFlush(header);
        record(header, revision, "REVISAR", user.id(), null);
        audit(user, caseId, header, "revisar_presupuesto_extra", requestContext);
        return response(header);
    }

    @Transactional
    public ExtraBudgetResponse registerPayment(Long caseId, ExtraBudgetPaymentRequest request, HttpServletRequest requestContext) {
        AuthenticatedUser user = currentUser.requireCurrentUser();
        CaseEntity caseEntity = requireCaseForUpdate(caseId);
        access.requireCaseAccess(user, caseEntity, "finanza.crear");
        requireExtraBudgetSupported(caseEntity);
        ExtraBudgetEntity header = requireHeaderForUpdate(caseId);
        assertExpected(header, request.expectedVersion());
        if (header.getCurrentStatus() != ExtraBudgetStatus.ACEPTADO || header.getAcceptedVersionId() == null || !"SI".equals(header.getCustomerConfirmation())) throw new ConflictException("El presupuesto extra debe estar ACEPTADO y confirmado por el cliente para registrar pagos");
        BigDecimal amount = money(request.amount());
        if (amount.signum() <= 0) throw new ConflictException("El importe del pago debe ser positivo");
        if (request.paymentMethodCode() == null || !paymentMethods.existsByCodeAndActiveTrue(normalize(request.paymentMethodCode()))) throw new ConflictException("paymentMethodCode no permitido: " + request.paymentMethodCode());
        if (request.receiptId() != null && receipts.findByIdAndCaseId(request.receiptId(), caseId).isEmpty()) throw new ResourceNotFoundException("No existe el comprobante del caso " + request.receiptId());
        BigDecimal balance = balance(header);
        if (amount.compareTo(balance) > 0) throw new ConflictException("El importe supera el saldo pendiente del presupuesto extra");
        Long payerId = casePersons.findByCaseIdAndPrincipalTrue(caseId)
                .map(person -> person.getPersonId())
                .orElseThrow(() -> new ConflictException("El caso no tiene cliente principal para imputar el pago extra"));
        if (!people.existsById(payerId)) throw new ResourceNotFoundException("No existe el cliente principal del caso");
        FinancialMovementEntity movement = new FinancialMovementEntity();
        movement.setCaseId(caseId); movement.setReceiptId(request.receiptId()); movement.setMovementTypeCode("INGRESO"); movement.setFlowOriginCode("CLIENTE");
        movement.setCounterpartyTypeCode("PERSONA"); movement.setCounterpartyPersonId(payerId); movement.setMovementAt(request.movementAt() == null ? LocalDateTime.now() : request.movementAt());
        movement.setGrossAmount(amount); movement.setNetAmount(amount); movement.setPaymentMethodCode(normalize(request.paymentMethodCode()));
        movement.setPaymentMethodDetail(blank(request.paymentMethodDetail())); movement.setCancellationTypeCode("TRABAJOS_EXTRAS"); movement.setAdvancePayment(false); movement.setBonification(false);
        movement.setReason(blank(request.reason()) == null ? "Pago de trabajos extras" : blank(request.reason())); movement.setExternalReference(blank(request.externalReference())); movement.setRegisteredBy(user.id());
        movement = movements.saveAndFlush(movement);
        ExtraBudgetPaymentApplicationEntity application = new ExtraBudgetPaymentApplicationEntity();
        application.setMovementId(movement.getId()); application.setExtraBudgetId(header.getId());
        application.setExtraBudgetVersionId(header.getAcceptedVersionId()); application.setAppliedAmount(amount);
        applications.save(application);
        record(header, currentVersion(header), "REGISTRAR_PAGO", user.id(), json(Map.of("movementId", movement.getId(), "amount", amount)));
        advanceVersionLock(header);
        audit(user, caseId, header, "registrar_pago_presupuesto_extra", requestContext);
        return response(header);
    }

    @Transactional
    public ExtraBudgetResponse annulPayment(Long caseId, ExtraBudgetPaymentAnnulmentRequest request, HttpServletRequest requestContext) {
        AuthenticatedUser user = currentUser.requireCurrentUser();
        CaseEntity caseEntity = requireCaseForUpdate(caseId);
        access.requireCaseAccess(user, caseEntity, "finanza.crear");
        requireExtraBudgetSupported(caseEntity);
        ExtraBudgetEntity header = requireHeaderForUpdate(caseId);
        assertExpected(header, request.expectedVersion());
        if (request.movementId() == null) throw new ConflictException("Debe indicar el pago extra a anular");
        ExtraBudgetPaymentApplicationEntity original = applications.findByExtraBudgetIdAndMovementId(header.getId(), request.movementId())
                .orElseThrow(() -> new ResourceNotFoundException("El pago no pertenece al presupuesto extra del caso"));
        if (original.getAppliedAmount().signum() <= 0) throw new ConflictException("Sólo puede anularse un pago extra aplicado");
        if (applications.existsByReversedApplicationId(original.getId())) throw new ConflictException("El pago extra ya fue anulado");
        FinancialMovementEntity originalMovement = movements.findById(original.getMovementId())
                .filter(movement -> caseId.equals(movement.getCaseId()))
                .orElseThrow(() -> new ResourceNotFoundException("No existe el movimiento financiero del pago extra"));

        FinancialMovementEntity reversal = new FinancialMovementEntity();
        reversal.setCaseId(caseId); reversal.setMovementTypeCode("EGRESO"); reversal.setFlowOriginCode("CLIENTE");
        reversal.setCounterpartyTypeCode("PERSONA"); reversal.setCounterpartyPersonId(originalMovement.getCounterpartyPersonId());
        reversal.setMovementAt(LocalDateTime.now()); reversal.setGrossAmount(original.getAppliedAmount()); reversal.setNetAmount(original.getAppliedAmount());
        reversal.setPaymentMethodCode(originalMovement.getPaymentMethodCode()); reversal.setPaymentMethodDetail(originalMovement.getPaymentMethodDetail());
        reversal.setCancellationTypeCode("TRABAJOS_EXTRAS"); reversal.setAdvancePayment(false); reversal.setBonification(false);
        reversal.setReason("Anulación de pago de trabajos extras"); reversal.setExternalReference(originalMovement.getPublicId()); reversal.setRegisteredBy(user.id());
        reversal = movements.saveAndFlush(reversal);

        ExtraBudgetPaymentApplicationEntity reversalApplication = new ExtraBudgetPaymentApplicationEntity();
        reversalApplication.setMovementId(reversal.getId()); reversalApplication.setExtraBudgetId(header.getId());
        reversalApplication.setExtraBudgetVersionId(original.getExtraBudgetVersionId()); reversalApplication.setAppliedAmount(original.getAppliedAmount().negate());
        reversalApplication.setReversedApplicationId(original.getId()); applications.saveAndFlush(reversalApplication);
        record(header, currentVersion(header), "ANULAR_PAGO", user.id(), json(Map.of("movementId", original.getMovementId(), "reversalMovementId", reversal.getId())));
        advanceVersionLock(header);
        audit(user, caseId, header, "anular_pago_presupuesto_extra", requestContext);
        return response(header);
    }

    @Transactional(readOnly = true)
    public byte[] pdf(Long caseId, Integer versionNumber) {
        AuthenticatedUser user = currentUser.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        access.requireCaseAccess(user, caseEntity, "presupuesto.ver");
        requireExtraBudgetSupported(caseEntity);
        ExtraBudgetEntity header = budgets.findByCaseId(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe presupuesto extra para el caso " + caseId));
        ExtraBudgetVersionEntity version = versions.findByExtraBudgetIdAndVersionNumber(header.getId(), versionNumber)
                .orElseThrow(() -> new ResourceNotFoundException("No existe la versión extra solicitada"));
        if (version.getPdfSnapshotJson() == null) throw new ConflictException("La versión todavía no tiene un documento extra congelado");
        try {
            return pdf.generate(objectMapper.readValue(version.getPdfSnapshotJson(), ExtraBudgetPdfService.Snapshot.class));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("No se pudo leer el documento extra congelado", exception);
        }
    }

    private ExtraBudgetResponse transition(Long caseId, ExtraBudgetTransitionRequest request, ExtraBudgetStatus target, HttpServletRequest requestContext) {
        AuthenticatedUser user = currentUser.requireCurrentUser();
        CaseEntity caseEntity = requireCaseForUpdate(caseId);
        access.requireCaseAccess(user, caseEntity, "presupuesto.crear");
        requireExtraBudgetSupported(caseEntity);
        ExtraBudgetEntity header = requireHeaderForUpdate(caseId);
        assertExpected(header, request.expectedVersion());
        ExtraBudgetVersionEntity version = currentVersion(header);
        if (!ExtraBudgetLifecycle.canTransition(version.getStatus(), target)) throw new ConflictException("Transición de presupuesto extra no permitida");
        LocalDateTime now = LocalDateTime.now();
        if (target == ExtraBudgetStatus.PRESENTADO) {
            if (!hasPositiveLine(version) || version.getTotal().signum() <= 0) {
                throw new ConflictException("El presupuesto extra debe incluir al menos una línea con importe positivo para presentarse");
            }
            if (header.getIssuedNumber() == null) header.setIssuedNumber(nextNumber(header));
            version.setStatus(target);
            freezeDocumentContext(version, caseEntity);
            version.setPresentedAt(now); version.setPresentedBy(user.id());
            version.setPdfSnapshotJson(json(snapshot(header, version)));
        } else if (target == ExtraBudgetStatus.ACEPTADO) {
            version.setStatus(target);
            if (!ExtraBudgetLifecycle.canAccept(version.getTotal(), paid(header))) throw new ConflictException("La revisión aceptada no puede ser menor a lo ya pagado");
            version.setAcceptedAt(now); version.setAcceptedBy(user.id()); header.setAcceptedVersionId(version.getId()); header.setAcceptedDebtAmount(version.getTotal());
        } else {
            version.setStatus(target);
            version.setRejectedAt(now); version.setRejectedBy(user.id()); version.setRejectionReason(blank(request.reason()));
        }
        header.setCurrentStatus(target);
        versions.save(version); budgets.saveAndFlush(header);
        record(header, version, target.name(), user.id(), request.reason() == null ? null : json(Map.of("reason", request.reason())));
        audit(user, caseId, header, target.name().toLowerCase() + "_presupuesto_extra", requestContext);
        return response(header);
    }

    private ExtraBudgetEntity newHeader(CaseEntity caseEntity) {
        ExtraBudgetEntity header = new ExtraBudgetEntity();
        header.setCaseId(caseEntity.getId()); header.setOrganizationId(caseEntity.getOrganizationId()); header.setBranchId(caseEntity.getBranchId());
        header.setCurrentVersion(1); header.setCurrentStatus(ExtraBudgetStatus.BORRADOR); header.setCustomerConfirmation("PENDIENTE"); header.setAcceptedDebtAmount(BigDecimal.ZERO); header.setActive(true);
        return header;
    }

    private ExtraBudgetVersionEntity newVersion(ExtraBudgetEntity header, int number) {
        ExtraBudgetVersionEntity version = new ExtraBudgetVersionEntity();
        version.setExtraBudgetId(header.getId()); version.setVersionNumber(number); version.setStatus(ExtraBudgetStatus.BORRADOR);
        version.setVatRate(ExtraBudgetCalculator.VAT_RATE); version.setPartsTotal(BigDecimal.ZERO); version.setLaborWithoutVat(BigDecimal.ZERO);
        version.setLaborVat(BigDecimal.ZERO); version.setLaborWithVat(BigDecimal.ZERO); version.setTotal(BigDecimal.ZERO);
        version.setGeneralLaborAmount(BigDecimal.ZERO); version.setGeneralLaborVatApplies(false);
        return version;
    }

    private void applyDraftDetails(ExtraBudgetVersionEntity version, ExtraBudgetDraftRequest request) {
        BigDecimal generalLabor = request.generalLaborAmount() == null ? BigDecimal.ZERO : money(request.generalLaborAmount());
        if (generalLabor.signum() < 0) throw new ConflictException("La mano de obra general no puede ser negativa");
        version.setGeneralLaborAmount(generalLabor);
        version.setGeneralLaborVatApplies(Boolean.TRUE.equals(request.generalLaborVatApplies()));
        version.setNotes(blank(request.notes()));
    }

    private void saveDraftItems(CaseEntity caseEntity, ExtraBudgetVersionEntity version, List<ExtraBudgetItemRequest> requested) {
        List<ExtraBudgetItemRequest> inputs = requested == null ? List.of() : requested;
        replaceManualItems(version, inputs);
        refreshTotals(version);
        comparisons.syncExtraDraft(caseEntity.getId(), version, items.findByExtraBudgetVersionIdOrderByVisualOrderAsc(version.getId()));
    }

    private void replaceManualItems(ExtraBudgetVersionEntity version, List<ExtraBudgetItemRequest> requested) {
        if (requested.stream().noneMatch(input -> input != null && !Boolean.FALSE.equals(input.active()))) {
            throw new ConflictException("items: debe incluir al menos una fila activa completa");
        }
        Map<Long, ExtraBudgetItemEntity> existing = new HashMap<>();
        items.findByExtraBudgetVersionIdOrderByVisualOrderAsc(version.getId()).forEach(item -> existing.put(item.getId(), item));
        int nextOrder = 1;
        for (ExtraBudgetItemRequest input : requested) {
            if (input == null) throw new ConflictException("items: cada fila debe ser válida");
            if (input.sourceType() != null && !"EXTRA_BUDGET_ITEM".equals(input.sourceType())) throw new ConflictException("sourceType: los trabajos extra deben usar EXTRA_BUDGET_ITEM");
            boolean active = !Boolean.FALSE.equals(input.active());
            validateAmounts(input, active);
            ExtraBudgetItemEntity item = input.sourceId() == null ? new ExtraBudgetItemEntity() : existing.remove(input.sourceId());
            if (item == null) throw new ConflictException("sourceId: el item extra no pertenece a la versión actual");
            item.setExtraBudgetVersionId(version.getId()); item.setVisualOrder(input.visualOrder() == null ? nextOrder : input.visualOrder()); item.setDescription(blank(input.description()) == null ? valueOrEmpty(input.affectedPiece()) : input.description().trim());
            item.setQuantity(moneyOrDefault(input.quantity(), BigDecimal.ONE)); item.setPartUnitAmount(moneyOrDefault(input.partUnitAmount(), BigDecimal.ZERO)); item.setLaborUnitAmount(moneyOrDefault(input.laborUnitAmount(), BigDecimal.ZERO));
            item.setPartsTotal(ExtraBudgetCalculator.lineTotal(item.getQuantity(), item.getPartUnitAmount()));
            item.setLaborTotal(ExtraBudgetCalculator.lineTotal(item.getQuantity(), item.getLaborUnitAmount()));
            item.setLineTotal(money(item.getPartsTotal().add(item.getLaborTotal()))); item.setActive(active); items.save(item);
            item.setAffectedPiece(blank(input.affectedPiece()) == null ? "" : input.affectedPiece().trim());
            item.setTaskCode(blank(input.taskCode())); item.setActionCode(blank(input.actionCode())); item.setDamageLevelCode(blank(input.damageLevelCode()));
            item.setPartsAmount(input.partsAmount() == null ? BigDecimal.ZERO : money(input.partsAmount()));
            item.setSourceType("EXTRA_BUDGET_ITEM"); item.setSourceId(item.getId()); items.save(item);
            nextOrder++;
        }
        existing.values().forEach(item -> { item.setActive(false); items.save(item); });
    }

    private void validateSourceItems(CaseEntity caseEntity, List<ExtraBudgetItemRequest> requested) {
        Set<Long> sourceIds = new HashSet<>();
        Set<Long> activeIds = activeAccessoryWorks(caseEntity).stream().map(BudgetAccessoryWorkEntity::getId).collect(java.util.stream.Collectors.toSet());
        for (ExtraBudgetItemRequest input : requested) {
            if (input == null) throw new ConflictException("Cada trabajo extra requiere descripción");
            if (isManual(input)) continue;
            if (input.sourceType() == null || input.sourceId() == null || !V66_ACCESSORY_WORK.equals(input.sourceType())) {
                throw new ConflictException("La fuente del trabajo extra no es válida");
            }
            if (!sourceIds.add(input.sourceId())) throw new ConflictException("La fuente del trabajo extra está duplicada");
            if (!activeIds.contains(input.sourceId())) throw new ConflictException("La fuente del trabajo extra no pertenece al caso o no está activa");
        }
        requested.stream().filter(input -> input != null && !isManual(input)).forEach(input -> validateAmounts(input, !Boolean.FALSE.equals(input.active())));
    }

    private void updateSourceLabor(ExtraBudgetVersionEntity version, List<ExtraBudgetItemRequest> requested) {
        Map<Long, ExtraBudgetItemEntity> existing = new HashMap<>();
        items.findByExtraBudgetVersionIdAndSourceTypeOrderByVisualOrderAsc(version.getId(), V66_ACCESSORY_WORK)
                .forEach(item -> existing.put(item.getSourceId(), item));
        requested.stream().filter(input -> input != null && !isManual(input)).forEach(input -> {
            ExtraBudgetItemEntity item = existing.get(input.sourceId());
            if (item != null) item.setLaborUnitAmount(money(input.laborUnitAmount()));
        });
    }

    private void validateAmounts(ExtraBudgetItemRequest input, boolean active) {
        if (input.quantity() != null && input.quantity().signum() <= 0) throw new ConflictException("quantity: debe ser positiva");
        if (input.partUnitAmount() != null && input.partUnitAmount().signum() < 0) throw new ConflictException("partUnitAmount: no puede ser negativo");
        if (input.laborUnitAmount() != null && input.laborUnitAmount().signum() < 0) throw new ConflictException("laborUnitAmount: no puede ser negativo");
        if (input.partsAmount() != null && input.partsAmount().signum() < 0) throw new ConflictException("partsAmount: no puede ser negativo");
        if (!active) return;
        if (blank(input.affectedPiece()) == null) throw new ConflictException("affectedPiece: es obligatoria para una fila activa");
        if (blank(input.actionCode()) == null) throw new ConflictException("actionCode: es obligatoria para una fila activa");
        if (blank(input.damageLevelCode()) == null) throw new ConflictException("damageLevelCode: es obligatorio para una fila activa");
        if (input.partsAmount() == null) throw new ConflictException("partsAmount: es obligatorio para una fila activa");
    }

    private void reconcileDraft(CaseEntity caseEntity, ExtraBudgetVersionEntity version) {
        if (version.getStatus() != ExtraBudgetStatus.BORRADOR) return;
        List<BudgetAccessoryWorkEntity> activeWorks = activeAccessoryWorks(caseEntity);
        Map<Long, ExtraBudgetItemEntity> existing = new HashMap<>();
        for (ExtraBudgetItemEntity item : items.findByExtraBudgetVersionIdAndSourceTypeOrderByVisualOrderAsc(version.getId(), V66_ACCESSORY_WORK)) {
            if (item.getSourceId() == null || existing.put(item.getSourceId(), item) != null) {
                throw new ConflictException("La fuente del trabajo extra está duplicada");
            }
        }
        int order = 1;
        for (BudgetAccessoryWorkEntity work : activeWorks) {
            ExtraBudgetItemEntity item = existing.remove(work.getId());
            if (item == null) {
                item = new ExtraBudgetItemEntity();
                item.setExtraBudgetVersionId(version.getId());
                item.setSourceType(V66_ACCESSORY_WORK); item.setSourceId(work.getId());
                item.setLaborUnitAmount(BigDecimal.ZERO); item.setActive(true);
            }
            item.setVisualOrder(order++);
            if (work.getAffectedPiece() != null && !work.getAffectedPiece().isBlank()) item.setDescription(work.getAffectedPiece().trim());
            else if (item.getDescription() == null || item.getDescription().isBlank()) item.setDescription("Trabajo extra " + work.getId());
            item.setQuantity(BigDecimal.ONE); item.setPartUnitAmount(money(work.getReplacementAmount()));
            item.setPartsTotal(ExtraBudgetCalculator.lineTotal(item.getQuantity(), item.getPartUnitAmount()));
            item.setLaborTotal(ExtraBudgetCalculator.lineTotal(item.getQuantity(), item.getLaborUnitAmount()));
            item.setLineTotal(money(item.getPartsTotal().add(item.getLaborTotal())));
            items.save(item);
        }
        existing.values().forEach(items::delete);
        items.flush();
        refreshTotals(version);
    }

    private void createEmptyCanonicalItem(ExtraBudgetVersionEntity version) {
        if (!items.findByExtraBudgetVersionIdOrderByVisualOrderAsc(version.getId()).isEmpty()) return;
        ExtraBudgetItemEntity item = new ExtraBudgetItemEntity();
        item.setExtraBudgetVersionId(version.getId()); item.setVisualOrder(1); item.setDescription("");
        item.setQuantity(BigDecimal.ONE); item.setPartUnitAmount(BigDecimal.ZERO); item.setLaborUnitAmount(BigDecimal.ZERO);
        item.setPartsTotal(BigDecimal.ZERO); item.setLaborTotal(BigDecimal.ZERO); item.setLineTotal(BigDecimal.ZERO);
        item.setAffectedPiece(""); item.setPartsAmount(BigDecimal.ZERO); item.setActive(true); item.setSourceType("EXTRA_BUDGET_ITEM");
        item = items.saveAndFlush(item); item.setSourceId(item.getId()); items.save(item);
        refreshTotals(version);
    }

    private List<BudgetAccessoryWorkEntity> activeAccessoryWorks(CaseEntity caseEntity) {
        return mainBudgets.findByCaseId(caseEntity.getId())
                .map(budget -> accessoryWorks.findByBudgetIdAndActiveTrueOrderByIdAsc(budget.getId()))
                .orElse(List.of());
    }

    private boolean isManual(ExtraBudgetItemRequest input) { return input != null && input.sourceType() == null && input.sourceId() == null; }

    private void refreshTotals(ExtraBudgetVersionEntity version) {
        var total = ExtraBudgetCalculator.calculateCanonical(items.findByExtraBudgetVersionIdOrderByVisualOrderAsc(version.getId()).stream()
                .map(item -> new ExtraBudgetCalculator.CanonicalItemInput(item.getPartsAmount(), Boolean.TRUE.equals(item.getActive()))).toList(),
                version.getGeneralLaborAmount(), Boolean.TRUE.equals(version.getGeneralLaborVatApplies()));
        version.setPartsTotal(total.partsTotal()); version.setLaborWithoutVat(total.laborWithoutVat()); version.setLaborVat(total.laborVat());
        version.setLaborWithVat(total.laborWithVat()); version.setTotal(total.total()); versions.save(version);
    }

    private ExtraBudgetPdfService.Snapshot snapshot(ExtraBudgetEntity header, ExtraBudgetVersionEntity version) {
        List<ExtraBudgetPdfService.Item> frozenItems = items.findByExtraBudgetVersionIdOrderByVisualOrderAsc(version.getId()).stream()
                .filter(item -> item.getLineTotal().signum() > 0)
                .map(item -> new ExtraBudgetPdfService.Item(item.getAffectedPiece(), item.getActionCode(), item.getDamageLevelCode(), item.getQuantity(), item.getPartsTotal())).toList();
        return new ExtraBudgetPdfService.Snapshot(header.getIssuedNumber(), version.getVersionNumber(), version.getStatus().name(), header.getCustomerConfirmation(),
                version.getNotes(), version.getGeneralLaborAmount(), Boolean.TRUE.equals(version.getGeneralLaborVatApplies()), version.getVatRate(),
                version.getPartsTotal(), version.getLaborVat(), version.getTotal(), frozenItems);
    }

    private boolean hasPositiveLine(ExtraBudgetVersionEntity version) {
        return items.findByExtraBudgetVersionIdOrderByVisualOrderAsc(version.getId()).stream()
                .anyMatch(item -> item.getLineTotal().signum() > 0);
    }

    private void promote(Long caseId, ExtraBudgetVersionEntity version, AuthenticatedUser user, HttpServletRequest requestContext) {
        for (ExtraBudgetItemEntity item : items.findByExtraBudgetVersionIdOrderByVisualOrderAsc(version.getId())) {
            if (!"EXTRA_BUDGET_ITEM".equals(item.getSourceType()) || !Boolean.TRUE.equals(item.getActive()) || !"REEMPLAZAR".equals(item.getActionCode())) continue;
            CasePartEntity part = caseParts.findByCaseIdAndExtraBudgetItemIdAndSourceTypeAndNonCanonicalFalse(caseId, item.getId(), CasePartSourceType.EXTRA_BUDGET_ITEM)
                    .orElseGet(() -> newExtraBudgetPart(caseId, item));
            boolean hasSelectedProvider = item.getSelectedProviderId() != null;
            part.setDescription(item.getAffectedPiece() == null || item.getAffectedPiece().isBlank() ? item.getDescription() : item.getAffectedPiece());
            part.setBudgetedPrice(hasSelectedProvider && item.getSelectedQuoteAmount() != null ? item.getSelectedQuoteAmount() : moneyOrZero(item.getPartsAmount()));
            part.setFinalPrice(part.getBudgetedPrice()); part.setProviderId(hasSelectedProvider ? item.getSelectedProviderId() : null); part.setFinalSupplier(hasSelectedProvider ? item.getSelectedProviderName() : null);
            part.setProviderAssignmentOrigin(ProviderAssignmentOrigin.BUDGET_ITEM);
            boolean created = part.getId() == null;
            part = caseParts.saveAndFlush(part);
            audit.register(user.id(), caseId, "repuestos_caso", part.getId(), created ? "promover_repuesto_presupuesto_extra" : "reintentar_promocion_repuesto_presupuesto_extra", null, null,
                    audit.toJson(Map.of("sourceType", "EXTRA_BUDGET_ITEM", "sourceId", item.getId())), requestContext);
        }
    }

    private CasePartEntity newExtraBudgetPart(Long caseId, ExtraBudgetItemEntity item) {
        CasePartEntity part = new CasePartEntity();
        part.setCaseId(caseId); part.setExtraBudgetItemId(item.getId()); part.setSourceType(CasePartSourceType.EXTRA_BUDGET_ITEM);
        part.setStatusCode("PENDIENTE"); part.setUsed(false); part.setReturned(false); part.setNonCanonical(false); part.setAccessory(true);
        return part;
    }

    private void requireCleanReversal(Long caseId) { requireCleanReversal(caseId, null); }
    private void requireCleanReversal(Long caseId, ExtraBudgetVersionEntity version) {
        Set<Long> versionItemIds = version == null ? null : items.findByExtraBudgetVersionIdOrderByVisualOrderAsc(version.getId()).stream().map(ExtraBudgetItemEntity::getId).collect(java.util.stream.Collectors.toSet());
        List<CasePartEntity> promoted = caseParts.findByCaseIdAndSourceTypeOrderByIdAsc(caseId, CasePartSourceType.EXTRA_BUDGET_ITEM);
        for (CasePartEntity part : promoted) {
            if (versionItemIds != null && !versionItemIds.contains(part.getExtraBudgetItemId())) continue;
            if (part.getAuthorizedCode() != null) throw new ConflictException("No puede revertirse: el repuesto extra tiene autorización");
            if (!"PENDIENTE".equals(part.getStatusCode())) throw new ConflictException("No puede revertirse: el repuesto extra tiene movimiento de reparación");
            if (part.getPurchasedByCode() != null || part.getPaymentStatusCode() != null) throw new ConflictException("No puede revertirse: el repuesto extra tiene compra o pago");
            if (part.getReceivedDate() != null) throw new ConflictException("No puede revertirse: el repuesto extra fue recibido");
            if (Boolean.TRUE.equals(part.getUsed()) || Boolean.TRUE.equals(part.getReturned())) throw new ConflictException("No puede revertirse: el repuesto extra fue usado o devuelto");
            if (part.getInventoryNumber() != null || part.getPartCode() != null) throw new ConflictException("No puede revertirse: el repuesto extra tiene inventario o etiqueta");
            if (part.getProviderAssignmentOrigin() == ProviderAssignmentOrigin.MANUAL || !partQuotes.findByPartIdOrderByIdAsc(part.getId()).isEmpty()) throw new ConflictException("No puede revertirse: el repuesto extra tiene cotización o asignación posterior");
        }
    }

    private void removeCleanPromotedParts(Long caseId) { removeCleanPromotedParts(caseId, null); }
    private void removeCleanPromotedParts(Long caseId, ExtraBudgetVersionEntity version) {
        Set<Long> versionItemIds = version == null ? null : items.findByExtraBudgetVersionIdOrderByVisualOrderAsc(version.getId()).stream().map(ExtraBudgetItemEntity::getId).collect(java.util.stream.Collectors.toSet());
        caseParts.findByCaseIdAndSourceTypeOrderByIdAsc(caseId, CasePartSourceType.EXTRA_BUDGET_ITEM).stream().filter(part -> versionItemIds == null || versionItemIds.contains(part.getExtraBudgetItemId())).forEach(caseParts::delete);
    }

    private ActivationState activationState(ExtraBudgetEntity header) {
        List<String> reasons = new java.util.ArrayList<>();
        boolean requiresConfirmation = hasSubstantiveData(header);
        if (requiresConfirmation) reasons.add("CONFIRMATION_REQUIRED");
        if (paid(header).signum() > 0) reasons.add("PAYMENTS");
        try {
            requireCleanReversal(header.getCaseId());
        } catch (ConflictException exception) {
            reasons.add("PROMOTED_ACTIVITY");
        }
        return new ActivationState(requiresConfirmation, reasons.stream().noneMatch(reason -> !"CONFIRMATION_REQUIRED".equals(reason)), reasons);
    }

    private boolean hasSubstantiveData(ExtraBudgetEntity header) {
        List<ExtraBudgetVersionEntity> allVersions = versions.findByExtraBudgetIdOrderByVersionNumberAsc(header.getId());
        if (allVersions.size() > 1 || paid(header).signum() > 0 || header.getIssuedNumber() != null || header.getAcceptedVersionId() != null) return true;
        for (ExtraBudgetVersionEntity version : allVersions) {
            if (version.getStatus() != ExtraBudgetStatus.BORRADOR || moneyOrZero(version.getTotal()).signum() > 0 || moneyOrZero(version.getGeneralLaborAmount()).signum() > 0 || version.getNotes() != null) return true;
            for (ExtraBudgetItemEntity item : items.findByExtraBudgetVersionIdOrderByVisualOrderAsc(version.getId())) {
                if (!"".equals(item.getDescription()) || moneyOrZero(item.getPartUnitAmount()).signum() != 0 || moneyOrZero(item.getLaborUnitAmount()).signum() != 0
                        || item.getSelectedProviderId() != null || item.getSelectedQuoteAmount() != null || item.getActionCode() != null) return true;
            }
        }
        return !caseParts.findByCaseIdAndSourceTypeOrderByIdAsc(header.getCaseId(), CasePartSourceType.EXTRA_BUDGET_ITEM).isEmpty();
    }

    private void freezeDocumentContext(ExtraBudgetVersionEntity version, CaseEntity caseEntity) {
        String customer = caseEntity.getPrincipalCustomerPersonId() == null ? null
                : people.findById(caseEntity.getPrincipalCustomerPersonId()).map(person -> person.getNombreMostrar()).orElse(null);
        String vehicle = caseEntity.getPrincipalVehicleId() == null ? null : vehicles.findById(caseEntity.getPrincipalVehicleId())
                .map(value -> String.join(" ", nonBlank(value.getBrandText()), nonBlank(value.getModelText()), nonBlank(value.getPlate())).trim()).orElse(null);
        version.setCustomerSnapshot(customer);
        version.setVehicleSnapshot(vehicle);
        version.setFolderSnapshot(caseEntity.getFolderCode());
    }

    private String nonBlank(String value) { return value == null ? "" : value; }
    private ExtraBudgetEntity requireHeaderForUpdate(Long caseId) { return budgets.findByCaseIdForUpdate(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe presupuesto extra para el caso " + caseId)); }
    private ExtraBudgetVersionEntity currentVersion(ExtraBudgetEntity header) { return versions.findByExtraBudgetIdAndVersionNumber(header.getId(), header.getCurrentVersion()).orElseThrow(() -> new IllegalStateException("Falta la versión actual del presupuesto extra")); }
    private CaseEntity requireCase(Long caseId) { return cases.findById(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId)); }
    private CaseEntity requireCaseForUpdate(Long caseId) { return cases.findByIdForUpdate(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId)); }
    private void requireExtraBudgetSupported(CaseEntity caseEntity) {
        String caseType = caseTypes.findById(caseEntity.getCaseTypeId()).map(CaseTypeEntity::getCode).orElse(null);
        if (!"TODO_RIESGO".equals(caseType) && !"GRANIZO".equals(caseType) && !"CLEAS".equals(caseType))
            throw new ConflictException("Los presupuestos extra sólo aplican a casos TODO_RIESGO, GRANIZO o CLEAS");
    }
    private BigDecimal paid(ExtraBudgetEntity header) { return moneyOrZero(applications.sumAppliedAmountByExtraBudgetId(header.getId())); }
    private BigDecimal balance(ExtraBudgetEntity header) { return money(header.getAcceptedDebtAmount().subtract(paid(header)).max(BigDecimal.ZERO)); }
    private void assertExpected(ExtraBudgetEntity header, Long expected) {
        if (expected == null || !expected.equals(header.getVersionLock())) {
            throw new DomainConflictException("EXTRA_BUDGET_VERSION_CONFLICT", "El presupuesto extra fue modificado por otra operación", Map.of("currentVersionLock", header.getVersionLock()));
        }
    }
    private void advanceVersionLock(ExtraBudgetEntity header) {
        // Detail-only mutations must also advance the header's optimistic version.
        header.setUpdatedAt(LocalDateTime.now());
        budgets.saveAndFlush(header);
    }
    private Long nextNumber(ExtraBudgetEntity header) {
        ExtraBudgetBranchSequenceEntity sequence = sequences.findByOrganizationIdAndBranchIdForUpdate(header.getOrganizationId(), header.getBranchId()).orElseGet(() -> {
            ExtraBudgetBranchSequenceEntity created = new ExtraBudgetBranchSequenceEntity(); ExtraBudgetBranchSequenceEntity.Id id = new ExtraBudgetBranchSequenceEntity.Id();
            id.setOrganizationId(header.getOrganizationId()); id.setBranchId(header.getBranchId()); created.setId(id); created.setNextNumber(1L); return sequences.saveAndFlush(created);
        });
        Long number = sequence.getNextNumber(); sequence.setNextNumber(number + 1); sequences.save(sequence); return number;
    }
    private void record(ExtraBudgetEntity header, ExtraBudgetVersionEntity version, String transition, Long actor, String metadata) {
        ExtraBudgetEventEntity event = new ExtraBudgetEventEntity(); event.setExtraBudgetId(header.getId()); event.setExtraBudgetVersionId(version.getId());
        event.setTransition(transition); event.setActorId(actor); event.setMetadataJson(metadata); events.save(event);
    }
    private void audit(AuthenticatedUser user, Long caseId, ExtraBudgetEntity header, String action, HttpServletRequest request) {
        audit.register(user.id(), caseId, "presupuestos_extra", header.getId(), action, null, null, audit.toJson(Map.of("domain", "presupuesto_extra")), request);
    }
    private ExtraBudgetResponse response(ExtraBudgetEntity header) {
        BigDecimal paid = paid(header);
        List<ExtraBudgetResponse.Payment> payments = applications.findByExtraBudgetIdOrderByCreatedAtAsc(header.getId()).stream()
                .map(payment -> new ExtraBudgetResponse.Payment(payment.getId(), payment.getMovementId(), payment.getExtraBudgetVersionId(), payment.getAppliedAmount(), payment.getReversedApplicationId())).toList();
        List<ExtraBudgetResponse.Version> versionResponses = versions.findByExtraBudgetIdOrderByVersionNumberAsc(header.getId()).stream().map(version -> new ExtraBudgetResponse.Version(
                version.getId(), version.getVersionNumber(), version.getStatus(), version.getPartsTotal(), version.getLaborWithoutVat(), version.getLaborVat(), version.getLaborWithVat(), version.getTotal(), version.getGeneralLaborAmount(), version.getGeneralLaborVatApplies(), version.getNotes(), version.getPdfSnapshotJson() != null, comparisons.findExtraDraftSnapshotId(version.getId()),
                items.findByExtraBudgetVersionIdOrderByVisualOrderAsc(version.getId()).stream().map(item -> new ExtraBudgetResponse.Item(item.getVisualOrder(), item.getDescription(), item.getQuantity(), item.getPartUnitAmount(), item.getLaborUnitAmount(), item.getPartsTotal(), item.getLaborTotal(), item.getLineTotal(), item.getSourceType(), item.getSourceId(), item.getAffectedPiece(), item.getTaskCode(), item.getActionCode(), item.getDamageLevelCode(), item.getPartsAmount(), item.getActive(), "EXTRA_BUDGET_ITEM".equals(item.getSourceType()) ? item.getId() : null)).toList())).toList();
        ActivationState activation = activationState(header);
        return new ExtraBudgetResponse(header.getId(), header.getCaseId(), header.getIssuedNumber(), header.getCurrentVersion(), header.getVersionLock(), header.getCurrentStatus(), header.getCustomerConfirmation(), header.getAcceptedVersionId(), currentVersion(header).getTotal(), paid, balance(header), payments, versionResponses,
                new ExtraBudgetResponse.Activation(Boolean.TRUE.equals(header.getActive()), activation.requiresConfirmation(), activation.eligible(), activation.reasons()));
    }
    private ExtraBudgetResponse inactiveResponse(Long caseId) {
        return new ExtraBudgetResponse(null, caseId, null, null, null, null, null, null, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, List.of(), List.of(),
                new ExtraBudgetResponse.Activation(false, false, true, List.of()));
    }
    private String json(Object value) { try { return objectMapper.writeValueAsString(value); } catch (JsonProcessingException exception) { throw new IllegalStateException("No se pudo guardar el snapshot extra", exception); } }
    private BigDecimal money(BigDecimal value) {
        if (value == null) throw new ConflictException("El importe debe ser un número válido");
        return value.setScale(2, RoundingMode.HALF_UP);
    }
    private BigDecimal moneyOrZero(BigDecimal value) { return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP); }
    private String normalize(String value) { return value.trim().toUpperCase(); }
    private String normalizeConfirmation(String value) {
        if (value == null) throw new ConflictException("confirmation: debe indicar PENDIENTE, SI o NO");
        String normalized = normalize(value);
        if (!"PENDIENTE".equals(normalized) && !"SI".equals(normalized) && !"NO".equals(normalized)) throw new ConflictException("confirmation: debe ser PENDIENTE, SI o NO");
        return normalized;
    }
    private BigDecimal moneyOrDefault(BigDecimal value, BigDecimal fallback) { return money(value == null ? fallback : value); }
    private String valueOrEmpty(String value) { return value == null ? "" : value.trim(); }
    private String blank(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private record ActivationState(boolean requiresConfirmation, boolean eligible, List<String> reasons) { }
}
