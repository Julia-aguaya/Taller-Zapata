package com.tallerzapata.backend.application.operation;

import com.tallerzapata.backend.api.operation.RepairPartResponse;
import com.tallerzapata.backend.api.operation.RepairPartUpdateRequest;
import com.tallerzapata.backend.application.casefile.CaseAuditService;
import com.tallerzapata.backend.application.cleas.CleasDownstreamGate;
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
import com.tallerzapata.backend.infrastructure.persistence.provider.ProviderEntity;
import com.tallerzapata.backend.infrastructure.persistence.provider.ProviderRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

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

    public RepairPartService(CasePartRepository casePartRepository, CaseRepository caseRepository, BudgetRepository budgetRepository,
                             CaseTypeRepository caseTypeRepository,
                             ProviderRepository providerRepository, CurrentUserService currentUserService,
                             CaseAccessControlService caseAccessControlService, CleasDownstreamGate cleasDownstreamGate,
                             CaseAuditService caseAuditService) {
        this.casePartRepository = casePartRepository;
        this.caseRepository = caseRepository;
        this.budgetRepository = budgetRepository;
        this.caseTypeRepository = caseTypeRepository;
        this.providerRepository = providerRepository;
        this.currentUserService = currentUserService;
        this.caseAccessControlService = caseAccessControlService;
        this.cleasDownstreamGate = cleasDownstreamGate;
        this.caseAuditService = caseAuditService;
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
        requireRepairAccess(caseEntity);
        CasePartEntity part = casePartRepository.findById(partId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el repuesto " + partId));
        if (!caseId.equals(part.getCaseId())) throw new ConflictException("El repuesto no pertenece al caso indicado");

        Map<String, Object> before = audit(part);
        ProviderEntity provider = resolveProvider(request.providerId());
        part.setProviderId(provider == null ? null : provider.getId());
        part.setFinalSupplier(provider == null ? blankToNull(request.finalSupplier()) : provider.getName());
        part.setAuthorizedCode(normalize(request.authorizationCode()));
        part.setStatusCode(requiredCode(request.statusCode(), "statusCode"));
        part.setPurchasedByCode(normalize(request.purchasedByCode()));
        part.setPaymentStatusCode(normalize(request.paymentStatusCode()));
        part.setReceivedDate(request.receivedDate());
        part.setUsed(Boolean.TRUE.equals(request.used()));
        part.setReturned(Boolean.TRUE.equals(request.returned()));
        casePartRepository.save(part);
        caseAuditService.register(user.id(), caseId, "repuestos_caso", partId, "actualizar_repuesto_operativo",
                caseAuditService.toJson(before), caseAuditService.toJson(audit(part)),
                caseAuditService.toJson(Map.of("domain", "operacion")), httpRequest);
        return toResponse(part);
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
        return new RepairPartResponse(part.getId(), part.getDescription(), part.getPartCode(), part.getFinalSupplier(),
                part.getAuthorizedCode(), part.getStatusCode(), part.getPurchasedByCode(), part.getPaymentStatusCode(),
                part.getReceivedDate(), part.getUsed(), part.getReturned(), part.getProviderId(),
                part.getSourceType() == null ? null : part.getSourceType().name(), part.getAccessory());
    }

    private Map<String, Object> audit(CasePartEntity part) {
        return Map.of("supplier", part.getFinalSupplier() == null ? "" : part.getFinalSupplier(),
                "statusCode", part.getStatusCode(), "purchasedByCode", part.getPurchasedByCode() == null ? "" : part.getPurchasedByCode(),
                "paymentStatusCode", part.getPaymentStatusCode() == null ? "" : part.getPaymentStatusCode());
    }

    private String requiredCode(String value, String field) {
        String normalized = normalize(value);
        if (normalized == null) throw new ConflictException(field + " es obligatorio");
        return normalized;
    }
    private String normalize(String value) { return value == null || value.isBlank() ? null : value.trim().toUpperCase(); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
