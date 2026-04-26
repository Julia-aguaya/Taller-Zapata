package com.tallerzapata.backend.application.recovery;

import com.tallerzapata.backend.api.recovery.FranchiseRecoveryResponse;
import com.tallerzapata.backend.api.recovery.FranchiseRecoveryUpsertRequest;
import com.tallerzapata.backend.application.casefile.CaseAuditService;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.recovery.*;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@Service
public class FranchiseRecoveryService {
    private final FranchiseRecoveryRepository franchiseRecoveryRepository;
    private final FranchiseRecoveryManagerRepository managerRepository;
    private final FranchiseRecoveryOpinionRepository opinionRepository;
    private final FranchiseRecoveryPaymentStatusRepository paymentStatusRepository;
    private final CaseRepository caseRepository;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService accessControlService;
    private final CaseAuditService caseAuditService;

    public FranchiseRecoveryService(FranchiseRecoveryRepository franchiseRecoveryRepository, FranchiseRecoveryManagerRepository managerRepository, FranchiseRecoveryOpinionRepository opinionRepository, FranchiseRecoveryPaymentStatusRepository paymentStatusRepository, CaseRepository caseRepository, CurrentUserService currentUserService, CaseAccessControlService accessControlService, CaseAuditService caseAuditService) {
        this.franchiseRecoveryRepository = franchiseRecoveryRepository;
        this.managerRepository = managerRepository;
        this.opinionRepository = opinionRepository;
        this.paymentStatusRepository = paymentStatusRepository;
        this.caseRepository = caseRepository;
        this.currentUserService = currentUserService;
        this.accessControlService = accessControlService;
        this.caseAuditService = caseAuditService;
    }

    @Transactional(readOnly = true)
    public FranchiseRecoveryResponse getFranchiseRecovery(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "recupero.ver");
        return franchiseRecoveryRepository.findByCaseId(caseId).map(this::toResponse).orElse(null);
    }

    @Transactional
    public FranchiseRecoveryResponse upsertFranchiseRecovery(Long caseId, FranchiseRecoveryUpsertRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "recupero.crear");
        validateRequest(caseId, request);
        FranchiseRecoveryEntity entity = franchiseRecoveryRepository.findByCaseId(caseId).orElseGet(FranchiseRecoveryEntity::new);
        entity.setCaseId(caseId);
        entity.setManagerCode(normalizedOptionalCode(request.managerCode()));
        entity.setBaseCaseId(request.baseCaseId());
        entity.setBaseFolderCode(blankToNull(request.baseFolderCode()));
        entity.setOpinionCode(normalizedOptionalCode(request.opinionCode()));
        entity.setAgreedAmount(scale(request.agreedAmount()));
        entity.setRecoveryAmount(scale(request.recoveryAmount()));
        entity.setEnablesRepair(Boolean.TRUE.equals(request.enablesRepair()));
        entity.setRecoversClient(Boolean.TRUE.equals(request.recoversClient()));
        entity.setClientAmount(scale(request.clientAmount()));
        entity.setClientPaymentStatusCode(normalizedOptionalCode(request.clientPaymentStatusCode()));
        entity.setClientPaymentDate(request.clientPaymentDate());
        entity.setApprovedLowerAgreement(Boolean.TRUE.equals(request.approvedLowerAgreement()));
        entity.setApprovalNote(blankToNull(request.approvalNote()));
        entity.setReusesBaseData(Boolean.TRUE.equals(request.reusesBaseData()));
        entity = franchiseRecoveryRepository.save(entity);
        caseAuditService.register(currentUser.id(), caseId, "recuperos_franquicia", entity.getId(), "upsert_recupero_franquicia", null, caseAuditService.toJson(Map.of("managerCode", entity.getManagerCode(), "opinionCode", entity.getOpinionCode())), caseAuditService.toJson(Map.of("domain", "recovery")), httpRequest);
        return toResponse(entity);
    }

    private void validateRequest(Long caseId, FranchiseRecoveryUpsertRequest request) {
        if (request.managerCode() != null && !managerRepository.existsByCodeAndActiveTrue(normalizeCode(request.managerCode()))) throw new ConflictException("managerCode no permitido: " + request.managerCode());
        if (request.opinionCode() != null && !opinionRepository.existsByCodeAndActiveTrue(normalizeCode(request.opinionCode()))) throw new ConflictException("opinionCode no permitido: " + request.opinionCode());
        if (request.clientPaymentStatusCode() != null && !paymentStatusRepository.existsByCodeAndActiveTrue(normalizeCode(request.clientPaymentStatusCode()))) throw new ConflictException("clientPaymentStatusCode no permitido: " + request.clientPaymentStatusCode());
        if (request.baseCaseId() != null && caseRepository.findById(request.baseCaseId()).isEmpty()) throw new ResourceNotFoundException("No existe el caso base " + request.baseCaseId());
        if (request.baseCaseId() != null && request.baseCaseId().equals(caseId)) throw new ConflictException("baseCaseId no puede ser el mismo caso");
    }

    private CaseEntity requireCase(Long caseId) { return caseRepository.findById(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId)); }
    private FranchiseRecoveryResponse toResponse(FranchiseRecoveryEntity e) { return new FranchiseRecoveryResponse(e.getId(), e.getCaseId(), e.getManagerCode(), e.getBaseCaseId(), e.getBaseFolderCode(), e.getOpinionCode(), e.getAgreedAmount(), e.getRecoveryAmount(), e.getEnablesRepair(), e.getRecoversClient(), e.getClientAmount(), e.getClientPaymentStatusCode(), e.getClientPaymentDate(), e.getApprovedLowerAgreement(), e.getApprovalNote(), e.getReusesBaseData()); }
    private String normalizeCode(String value) { return value == null || value.isBlank() ? null : value.trim().toUpperCase(); }
    private String normalizedOptionalCode(String value) { return value == null || value.isBlank() ? null : normalizeCode(value); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private BigDecimal scale(BigDecimal value) { return value == null ? null : value.setScale(2, RoundingMode.HALF_UP); }
}
