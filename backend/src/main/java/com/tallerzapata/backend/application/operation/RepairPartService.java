package com.tallerzapata.backend.application.operation;

import com.tallerzapata.backend.api.operation.RepairPartResponse;
import com.tallerzapata.backend.api.operation.RepairPartReceiptRequest;
import com.tallerzapata.backend.api.operation.RepairPartReceiptResponse;
import com.tallerzapata.backend.api.operation.RepairPartUpdateRequest;
import com.tallerzapata.backend.application.casefile.CaseAuditService;
import com.tallerzapata.backend.application.casefile.particular.ParticularEffectiveStateRecalculator;
import com.tallerzapata.backend.application.casefile.todoriskstate.TodoRiesgoEffectiveStateRecalculator;
import com.tallerzapata.backend.application.casefile.cleasstate.CleasEffectiveStateRecalculator;
import com.tallerzapata.backend.application.cleas.CleasDownstreamGate;
import com.tallerzapata.backend.application.recovery.FranchiseRecoveryRepairGate;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartRepository;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.operation.RepairPartReceiptEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.RepairPartReceiptRepository;
import com.tallerzapata.backend.infrastructure.persistence.provider.ProviderEntity;
import com.tallerzapata.backend.infrastructure.persistence.provider.ProviderRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.time.LocalDate;

@Service
public class RepairPartService {
    private final CasePartRepository casePartRepository;
    private final CaseRepository caseRepository;
    private final BudgetRepository budgetRepository;
    private final CaseTypeRepository caseTypeRepository;
    private final ProviderRepository providerRepository;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService caseAccessControlService;
    private final CleasDownstreamGate cleasDownstreamGate;
    private final CaseAuditService caseAuditService;
    private final FranchiseRecoveryRepairGate franchiseRecoveryRepairGate;
    private final RepairPartReceiptRepository repairPartReceiptRepository;
    private final RepairPartReceiptAvailabilityService receiptAvailabilityService;
    private final ParticularEffectiveStateRecalculator particularEffectiveStateRecalculator;
    private final TodoRiesgoEffectiveStateRecalculator todoRiesgoEffectiveStateRecalculator;
    private final CleasEffectiveStateRecalculator cleasEffectiveStateRecalculator;

    public RepairPartService(CasePartRepository casePartRepository, CaseRepository caseRepository, BudgetRepository budgetRepository,
                             CaseTypeRepository caseTypeRepository,
                              ProviderRepository providerRepository, CurrentUserService currentUserService,
                              CaseAccessControlService caseAccessControlService, CleasDownstreamGate cleasDownstreamGate,
                                CaseAuditService caseAuditService, FranchiseRecoveryRepairGate franchiseRecoveryRepairGate,
                                RepairPartReceiptRepository repairPartReceiptRepository,
                                RepairPartReceiptAvailabilityService receiptAvailabilityService,
                                ParticularEffectiveStateRecalculator particularEffectiveStateRecalculator,
                                TodoRiesgoEffectiveStateRecalculator todoRiesgoEffectiveStateRecalculator,
                                CleasEffectiveStateRecalculator cleasEffectiveStateRecalculator) {
        this.casePartRepository = casePartRepository;
        this.caseRepository = caseRepository;
        this.budgetRepository = budgetRepository;
        this.caseTypeRepository = caseTypeRepository;
        this.providerRepository = providerRepository;
        this.currentUserService = currentUserService;
        this.caseAccessControlService = caseAccessControlService;
        this.cleasDownstreamGate = cleasDownstreamGate;
        this.caseAuditService = caseAuditService;
        this.franchiseRecoveryRepairGate = franchiseRecoveryRepairGate;
        this.repairPartReceiptRepository = repairPartReceiptRepository;
        this.receiptAvailabilityService = receiptAvailabilityService;
        this.particularEffectiveStateRecalculator = particularEffectiveStateRecalculator;
        this.todoRiesgoEffectiveStateRecalculator = todoRiesgoEffectiveStateRecalculator;
        this.cleasEffectiveStateRecalculator = cleasEffectiveStateRecalculator;
    }

    @Transactional(readOnly = true)
    public List<RepairPartResponse> list(Long caseId) {
        AuthenticatedUser user = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        caseAccessControlService.requireCaseAccess(user, caseEntity, "turno.ver");
        return casePartRepository.findByCaseIdOrderByIdAsc(caseId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public RepairPartResponse update(Long caseId, Long partId, RepairPartUpdateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser user = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        caseAccessControlService.requireCaseAccess(user, caseEntity, "turno.editar");
        cleasDownstreamGate.requireAllowed(caseEntity);
        franchiseRecoveryRepairGate.requireEnabled(caseEntity);
        requireRepairAccess(caseEntity);
        CasePartEntity part = requirePart(caseId, partId);

        Map<String, Object> before = audit(part);
        int receivedQuantity = receiptAvailabilityService.receivedQuantity(partId);
        if (request.orderedQuantity() != null) {
            requireOrderedQuantity(request.orderedQuantity(), receivedQuantity);
            part.setOrderedQuantity(request.orderedQuantity());
        }
        ProviderEntity provider = resolveProvider(request.providerId());
        part.setProviderId(provider == null ? null : provider.getId());
        part.setFinalSupplier(provider == null ? blankToNull(request.finalSupplier()) : provider.getName());
        part.setAuthorizedCode(normalize(request.authorizationCode()));
        part.setStatusCode(requiredCode(request.statusCode(), "statusCode"));
        part.setPurchasedByCode(normalize(request.purchasedByCode()));
        part.setPaymentStatusCode(normalize(request.paymentStatusCode()));
        part.setUsed(Boolean.TRUE.equals(request.used()));
        part.setReturned(Boolean.TRUE.equals(request.returned()));
        casePartRepository.save(part);
        caseAuditService.register(user.id(), caseId, "repuestos_caso", partId, "actualizar_repuesto_operativo",
                caseAuditService.toJson(before), caseAuditService.toJson(audit(part)),
                caseAuditService.toJson(Map.of("domain", "operacion")), httpRequest);
        return toResponse(part);
    }

    @Transactional
    public RepairPartResponse createReceipt(Long caseId, Long partId, RepairPartReceiptRequest request, HttpServletRequest httpRequest) {
        WriteContext context = requireWriteAccess(caseId, partId);
        requireReceiptAuthorization(context.part());
        int before = receiptAvailabilityService.receivedQuantity(partId);
        requireWithinOrderedQuantity(context.part(), before + request.quantity());
        RepairPartReceiptEntity receipt = new RepairPartReceiptEntity();
        receipt.setPartId(partId);
        receipt.setQuantity(request.quantity());
        receipt.setReceiptDate(request.receiptDate());
        repairPartReceiptRepository.save(receipt);
        caseAuditService.register(context.user().id(), caseId, "repuestos_caso_recepciones", receipt.getId(), "registrar_recepcion_repuesto",
                null, caseAuditService.toJson(receiptAudit(receipt)), caseAuditService.toJson(Map.of("domain", "operacion")), httpRequest);
        recalculateEffectiveState(caseId);
        return toResponse(context.part());
    }

    @Transactional
    public RepairPartResponse updateReceipt(Long caseId, Long partId, Long receiptId, RepairPartReceiptRequest request, HttpServletRequest httpRequest) {
        WriteContext context = requireWriteAccess(caseId, partId);
        requireReceiptAuthorization(context.part());
        RepairPartReceiptEntity receipt = repairPartReceiptRepository.findByIdAndPartId(receiptId, partId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe la recepción " + receiptId));
        Map<String, Object> before = receiptAudit(receipt);
        requireWithinOrderedQuantity(context.part(), receiptAvailabilityService.receivedQuantity(partId) - receipt.getQuantity() + request.quantity());
        receipt.setQuantity(request.quantity());
        receipt.setReceiptDate(request.receiptDate());
        repairPartReceiptRepository.save(receipt);
        caseAuditService.register(context.user().id(), caseId, "repuestos_caso_recepciones", receiptId, "actualizar_recepcion_repuesto",
                caseAuditService.toJson(before), caseAuditService.toJson(receiptAudit(receipt)), caseAuditService.toJson(Map.of("domain", "operacion")), httpRequest);
        recalculateEffectiveState(caseId);
        return toResponse(context.part());
    }

    @Transactional
    public void deleteReceipt(Long caseId, Long partId, Long receiptId, HttpServletRequest httpRequest) {
        WriteContext context = requireWriteAccess(caseId, partId);
        RepairPartReceiptEntity receipt = repairPartReceiptRepository.findByIdAndPartId(receiptId, partId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe la recepción " + receiptId));
        Map<String, Object> before = receiptAudit(receipt);
        repairPartReceiptRepository.delete(receipt);
        caseAuditService.register(context.user().id(), caseId, "repuestos_caso_recepciones", receiptId, "eliminar_recepcion_repuesto",
                caseAuditService.toJson(before), null, caseAuditService.toJson(Map.of("domain", "operacion")), httpRequest);
        recalculateEffectiveState(caseId);
    }

    private CaseEntity requireCase(Long caseId) {
        return caseRepository.findById(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
    }

    private void requireRepairAccess(CaseEntity caseEntity) {
        BudgetEntity budget = budgetRepository.findByCaseId(caseEntity.getId()).orElse(null);
        String caseType = caseTypeRepository.findById(caseEntity.getCaseTypeId()).map(type -> type.getCode()).orElse("");
        boolean allowed = "PARTICULAR".equals(caseType)
                ? budget != null && "CERRADO".equals(budget.getReportStatusCode())
                : budget != null;
        if (!allowed) {
            throw new ConflictException("La gestión operativa de repuestos se habilita cuando el presupuesto permite iniciar la reparación.");
        }
    }

    private ProviderEntity resolveProvider(Long providerId) {
        if (providerId == null) return null;
        ProviderEntity provider = providerRepository.findById(providerId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el proveedor " + providerId));
        if (!Boolean.TRUE.equals(provider.getActive())) throw new ConflictException("El proveedor esta inactivo: " + providerId);
        return provider;
    }

    private RepairPartResponse toResponse(CasePartEntity part) {
        List<RepairPartReceiptEntity> receipts = repairPartReceiptRepository.findByPartIdOrderByReceiptDateAscIdAsc(part.getId());
        int receivedQuantity = receipts.stream().mapToInt(RepairPartReceiptEntity::getQuantity).sum();
        int orderedQuantity = receiptAvailabilityService.orderedQuantity(part);
        LocalDate receivedDate = receipts.stream().map(RepairPartReceiptEntity::getReceiptDate)
                .filter(java.util.Objects::nonNull).reduce((first, second) -> second).orElse(null);
        return new RepairPartResponse(part.getId(), part.getDescription(), part.getPartCode(), part.getFinalSupplier(),
                part.getAuthorizedCode(), part.getStatusCode(), part.getPurchasedByCode(), part.getPaymentStatusCode(),
                receivedDate, part.getUsed(), part.getReturned(), part.getProviderId(),
                part.getSourceType() == null ? null : part.getSourceType().name(), part.getAccessory(), orderedQuantity,
                receivedQuantity, receiptStatus(orderedQuantity, receivedQuantity), receipts.stream()
                .map(receipt -> new RepairPartReceiptResponse(receipt.getId(), receipt.getQuantity(), receipt.getReceiptDate())).toList());
    }

    private Map<String, Object> audit(CasePartEntity part) {
        return Map.of("supplier", part.getFinalSupplier() == null ? "" : part.getFinalSupplier(),
                "statusCode", part.getStatusCode(), "purchasedByCode", part.getPurchasedByCode() == null ? "" : part.getPurchasedByCode(),
                "paymentStatusCode", part.getPaymentStatusCode() == null ? "" : part.getPaymentStatusCode());
    }

    private WriteContext requireWriteAccess(Long caseId, Long partId) {
        AuthenticatedUser user = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        caseAccessControlService.requireCaseAccess(user, caseEntity, "turno.editar");
        cleasDownstreamGate.requireAllowed(caseEntity);
        franchiseRecoveryRepairGate.requireEnabled(caseEntity);
        requireRepairAccess(caseEntity);
        return new WriteContext(user, requirePart(caseId, partId));
    }

    private CasePartEntity requirePart(Long caseId, Long partId) {
        CasePartEntity part = casePartRepository.findByIdForUpdate(partId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el repuesto " + partId));
        if (!caseId.equals(part.getCaseId())) throw new ConflictException("El repuesto no pertenece al caso indicado");
        return part;
    }

    private void requireOrderedQuantity(int orderedQuantity, int receivedQuantity) {
        if (orderedQuantity <= 0) throw new ConflictException("La cantidad pedida debe ser positiva");
        if (receivedQuantity > orderedQuantity) throw new ConflictException("La cantidad recibida no puede superar la cantidad pedida");
    }

    private void requireWithinOrderedQuantity(CasePartEntity part, int receivedQuantity) {
        requireOrderedQuantity(receiptAvailabilityService.orderedQuantity(part), receivedQuantity);
    }

    private void requireReceiptAuthorization(CasePartEntity part) {
        if ("RECHAZADO".equals(normalize(part.getAuthorizedCode()))) {
            throw new ConflictException("No se puede registrar ni modificar una recepción cuando la autorización del repuesto está rechazada");
        }
    }

    private void recalculateEffectiveState(Long caseId) {
        particularEffectiveStateRecalculator.recalculate(caseId);
        todoRiesgoEffectiveStateRecalculator.recalculate(caseId);
        cleasEffectiveStateRecalculator.recalculate(caseId);
    }

    private String receiptStatus(int orderedQuantity, int receivedQuantity) {
        if (receivedQuantity == 0) return "PENDIENTE";
        return receivedQuantity < orderedQuantity ? "PARCIAL" : "RECIBIDO";
    }

    private Map<String, Object> receiptAudit(RepairPartReceiptEntity receipt) {
        return CaseAuditService.auditMap("quantity", receipt.getQuantity(), "receiptDate", receipt.getReceiptDate());
    }

    private record WriteContext(AuthenticatedUser user, CasePartEntity part) {}

    private String requiredCode(String value, String field) {
        String normalized = normalize(value);
        if (normalized == null) throw new ConflictException(field + " es obligatorio");
        return normalized;
    }
    private String normalize(String value) { return value == null || value.isBlank() ? null : value.trim().toUpperCase(); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
