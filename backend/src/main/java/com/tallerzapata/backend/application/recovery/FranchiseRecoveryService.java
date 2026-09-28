package com.tallerzapata.backend.application.recovery;

import com.tallerzapata.backend.api.casefile.CodeCatalogResponse;
import com.tallerzapata.backend.api.recovery.FranchiseRecoveryCatalogsResponse;
import com.tallerzapata.backend.api.recovery.FranchiseRecoveryResponse;
import com.tallerzapata.backend.api.recovery.FranchiseRecoveryUpsertRequest;
import com.tallerzapata.backend.application.casefile.CaseAuditService;
import com.tallerzapata.backend.application.casefile.InsuranceRepairCasePolicy;
import com.tallerzapata.backend.application.casefile.CaseService;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRelationEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRelationRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementEntity;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementRepository;
import com.tallerzapata.backend.infrastructure.persistence.notification.NotificationEntity;
import com.tallerzapata.backend.infrastructure.persistence.notification.NotificationRepository;
import com.tallerzapata.backend.infrastructure.persistence.recovery.*;
import com.tallerzapata.backend.infrastructure.persistence.security.UserRoleRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class FranchiseRecoveryService {
    private final InsuranceRepairCasePolicy insuranceRepairCasePolicy = new InsuranceRepairCasePolicy();
    private final FranchiseRecoveryRepository franchiseRecoveryRepository;
    private final FranchiseRecoveryManagerRepository managerRepository;
    private final FranchiseRecoveryOpinionRepository opinionRepository;
    private final FranchiseRecoveryPaymentStatusRepository paymentStatusRepository;
    private final CaseRepository caseRepository;
    private final CaseTypeRepository caseTypeRepository;
    private final CaseRelationRepository caseRelationRepository;
    private final CaseService caseService;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService accessControlService;
    private final CaseAuditService caseAuditService;
    private final FinancialMovementRepository financialMovementRepository;
    private final NotificationRepository notificationRepository;
    private final UserRoleRepository userRoleRepository;

    public FranchiseRecoveryService(FranchiseRecoveryRepository franchiseRecoveryRepository, FranchiseRecoveryManagerRepository managerRepository, FranchiseRecoveryOpinionRepository opinionRepository, FranchiseRecoveryPaymentStatusRepository paymentStatusRepository, CaseRepository caseRepository, CaseTypeRepository caseTypeRepository, CaseRelationRepository caseRelationRepository, CaseService caseService, CurrentUserService currentUserService, CaseAccessControlService accessControlService, CaseAuditService caseAuditService, FinancialMovementRepository financialMovementRepository, NotificationRepository notificationRepository, UserRoleRepository userRoleRepository) {
        this.franchiseRecoveryRepository = franchiseRecoveryRepository;
        this.managerRepository = managerRepository;
        this.opinionRepository = opinionRepository;
        this.paymentStatusRepository = paymentStatusRepository;
        this.caseRepository = caseRepository;
        this.caseTypeRepository = caseTypeRepository;
        this.caseRelationRepository = caseRelationRepository;
        this.caseService = caseService;
        this.currentUserService = currentUserService;
        this.accessControlService = accessControlService;
        this.caseAuditService = caseAuditService;
        this.financialMovementRepository = financialMovementRepository;
        this.notificationRepository = notificationRepository;
        this.userRoleRepository = userRoleRepository;
    }

    @Transactional(readOnly = true)
    public FranchiseRecoveryCatalogsResponse listCatalogs() {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        accessControlService.requirePermission(currentUser, "recupero.ver");
        return new FranchiseRecoveryCatalogsResponse(
                managerRepository.findAll().stream().filter(i -> Boolean.TRUE.equals(i.getActive())).map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                opinionRepository.findAll().stream().filter(i -> Boolean.TRUE.equals(i.getActive())).map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                paymentStatusRepository.findAll().stream().filter(i -> Boolean.TRUE.equals(i.getActive())).map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList()
        );
    }

    @Transactional(readOnly = true)
    public FranchiseRecoveryResponse getFranchiseRecovery(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "recupero.ver");
        requireRecoveryCase(caseEntity);
        return franchiseRecoveryRepository.findByCaseId(caseId).map(this::toResponse).orElse(null);
    }

    @Transactional
    public FranchiseRecoveryResponse upsertFranchiseRecovery(Long caseId, FranchiseRecoveryUpsertRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "recupero.crear");
        requireRecoveryCase(caseEntity);
        FranchiseRecoveryEntity entity = franchiseRecoveryRepository.findByCaseId(caseId)
                .orElseThrow(() -> new ConflictException("El recupero solo se crea desde una carpeta TODO_RIESGO vinculada"));
        validateRequest(caseEntity, entity, request);
        entity.setCaseId(caseId);
        entity.setManagerCode(normalizedOptionalCode(request.managerCode()));
        entity.setOpinionCode(normalizedOptionalCode(request.opinionCode()));
        entity.setAgreedAmount(scale(request.agreedAmount()));
        entity.setRecoveryAmount(scale(request.recoveryAmount()));
        entity.setEnablesRepair(Boolean.TRUE.equals(request.enablesRepair()));
        entity.setRecoversClient(Boolean.TRUE.equals(request.recoversClient()));
        entity.setClientAmount("CULPA_COMPARTIDA".equals(normalizedOptionalCode(request.opinionCode())) && request.recoveryAmount() != null
                ? scale(request.recoveryAmount().divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP))
                : scale(request.clientAmount()));
        entity.setClientPaymentStatusCode(normalizedOptionalCode(request.clientPaymentStatusCode()));
        entity.setClientPaymentDate(request.clientPaymentDate());
        // La aprobación es una acción privilegiada separada. Nunca proviene del formulario del operador.
        if (!requiresLowerAgreementApproval(entity)) {
            entity.setApprovedLowerAgreement(false);
            entity.setApprovalNote(null);
            entity.setApprovedByUserId(null);
            entity.setApprovedAt(null);
        }
        entity.setReusesBaseData(hasCompatibleBaseSnapshot(entity, caseEntity));
        entity = franchiseRecoveryRepository.save(entity);
        if (Boolean.TRUE.equals(entity.getEnablesRepair())) caseService.copyRecoveryBudgetFromBase(entity.getBaseCaseId(), caseId);
        if (requiresLowerAgreementApproval(entity) && !Boolean.TRUE.equals(entity.getApprovedLowerAgreement())) {
            notifyGlobalAdminsOfLowerAgreement(entity, caseEntity, currentUser);
        }
        registerSharedFaultCollectionOnce(entity, caseEntity, currentUser, httpRequest);
        caseAuditService.register(currentUser.id(), caseId, "recuperos_franquicia", entity.getId(), "upsert_recupero_franquicia", null, caseAuditService.toJson(Map.of("managerCode", entity.getManagerCode(), "opinionCode", entity.getOpinionCode())), caseAuditService.toJson(Map.of("domain", "recovery")), httpRequest);
        return toResponse(entity);
    }

    @Transactional
    public Long createRecoveryFromBaseCase(Long baseCaseId, HttpServletRequest httpRequest) {
        CaseEntity base = caseRepository.findById(baseCaseId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el caso base " + baseCaseId));
        requireTodoRiesgoBase(base);
        CaseEntity child = caseService.createRecoveryChildCase(baseCaseId, httpRequest);

        FranchiseRecoveryEntity recovery = new FranchiseRecoveryEntity();
        recovery.setCaseId(child.getId());
        recovery.setManagerCode("TALLER");
        recovery.setBaseCaseId(baseCaseId);
        recovery.setBaseFolderCode(base.getFolderCode());
        recovery.setReusesBaseData(true);
        recovery.setEnablesRepair(false);
        recovery.setRecoversClient(false);
        recovery.setApprovedLowerAgreement(false);
        franchiseRecoveryRepository.save(recovery);

        CaseRelationEntity relation = new CaseRelationEntity();
        relation.setSourceCaseId(baseCaseId);
        relation.setTargetCaseId(child.getId());
        relation.setRelationTypeCode("RECUPERO_DE");
        relation.setDescription("Recupero de franquicia de la carpeta " + base.getFolderCode());
        caseRelationRepository.save(relation);

        return child.getId();
    }

    @Transactional
    public FranchiseRecoveryResponse approveLowerAgreement(Long caseId, String reason, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        requireRecoveryCase(caseEntity);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "recupero.crear");
        if (!accessControlService.hasGlobalScope(currentUser)) throw new com.tallerzapata.backend.application.common.ForbiddenException("La aprobación requiere ROLE_ADMIN global");
        FranchiseRecoveryEntity recovery = franchiseRecoveryRepository.findByCaseId(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el recupero de franquicia"));
        if (!requiresLowerAgreementApproval(recovery)) throw new ConflictException("El recupero no requiere aprobación por monto menor");
        recovery.setApprovedLowerAgreement(true);
        recovery.setApprovalNote(blankToNull(reason));
        recovery.setApprovedByUserId(currentUser.id());
        recovery.setApprovedAt(LocalDateTime.now());
        recovery = franchiseRecoveryRepository.save(recovery);
        caseAuditService.register(currentUser.id(), caseId, "recuperos_franquicia", recovery.getId(), "aprobar_monto_recupero_menor", null,
                caseAuditService.toJson(Map.of("approvedByUserId", currentUser.id(), "reason", recovery.getApprovalNote())), caseAuditService.toJson(Map.of("domain", "recovery")), httpRequest);
        return toResponse(recovery);
    }

    /** Internal policy hook for the shared legal module; it does not expose a new legal flow. */
    @Transactional(readOnly = true)
    public boolean isManagedByLawyer(Long caseId) {
        return franchiseRecoveryRepository.findByCaseId(caseId)
                .map(recovery -> "ABOGADO".equals(normalizeCode(recovery.getManagerCode())))
                .orElse(false);
    }

    private void validateRequest(CaseEntity caseEntity, FranchiseRecoveryEntity entity, FranchiseRecoveryUpsertRequest request) {
        if (request.managerCode() != null && !List.of("TALLER", "ABOGADO").contains(normalizeCode(request.managerCode()))) throw new ConflictException("managerCode solo permite TALLER o ABOGADO");
        if (request.managerCode() != null && !managerRepository.existsByCodeAndActiveTrue(normalizeCode(request.managerCode()))) throw new ConflictException("managerCode no permitido: " + request.managerCode());
        if (request.opinionCode() != null && !opinionRepository.existsByCodeAndActiveTrue(normalizeCode(request.opinionCode()))) throw new ConflictException("opinionCode no permitido: " + request.opinionCode());
        if (request.clientPaymentStatusCode() != null && !paymentStatusRepository.existsByCodeAndActiveTrue(normalizeCode(request.clientPaymentStatusCode()))) throw new ConflictException("clientPaymentStatusCode no permitido: " + request.clientPaymentStatusCode());
        if ("CULPA_COMPARTIDA".equals(normalizeCode(request.opinionCode()))) {
            if (request.recoveryAmount() == null || request.recoveryAmount().signum() < 0) throw new ConflictException("Con culpa compartida debe indicar el monto a recuperar");
            if (!Boolean.TRUE.equals(request.recoversClient())) throw new ConflictException("Con culpa compartida debe recuperarse el 50% a cargo del cliente");
            if (request.clientPaymentStatusCode() == null || request.clientPaymentDate() == null) throw new ConflictException("Con culpa compartida debe registrar estado y fecha del cobro al cliente");
        }
        if (request.baseCaseId() != null && !request.baseCaseId().equals(entity.getBaseCaseId())) throw new ConflictException("La carpeta base del recupero no puede modificarse");
        if (request.baseFolderCode() != null && !request.baseFolderCode().equals(entity.getBaseFolderCode())) throw new ConflictException("La carpeta base del recupero no puede modificarse");
        CaseEntity base = requireCase(entity.getBaseCaseId());
        requireTodoRiesgoBase(base);
        if (!base.getFolderCode().equals(entity.getBaseFolderCode())) throw new ConflictException("La carpeta base vinculada no coincide con el recupero");
    }

    private CaseEntity requireCase(Long caseId) { return caseRepository.findById(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId)); }
    private void requireRecoveryCase(CaseEntity caseEntity) { if (!caseTypeRepository.findById(caseEntity.getCaseTypeId()).map(type -> "RECUPERO_FRANQUICIA".equals(type.getCode())).orElse(false)) throw new ConflictException("Recupero de franquicia solo aplica a carpetas RECUPERO_FRANQUICIA"); }
    private void requireTodoRiesgoBase(CaseEntity caseEntity) { if (!caseTypeRepository.findById(caseEntity.getCaseTypeId()).map(type -> "TODO_RIESGO".equals(type.getCode())).orElse(false)) throw new ConflictException("La carpeta base debe ser de tipo TODO_RIESGO"); }
    private boolean hasCompatibleBaseSnapshot(FranchiseRecoveryEntity recovery, CaseEntity recoveryCase) {
        if (recovery.getBaseCaseId() == null || recovery.getBaseFolderCode() == null) return false;
        CaseEntity base = caseRepository.findById(recovery.getBaseCaseId()).orElse(null);
        if (base == null || !recovery.getBaseFolderCode().equals(base.getFolderCode())) return false;
        boolean isTodoRiesgoBase = caseTypeRepository.findById(base.getCaseTypeId())
                .map(type -> "TODO_RIESGO".equals(type.getCode()))
                .orElse(false);
        boolean copiedCaseSnapshot = base.getOrganizationId().equals(recoveryCase.getOrganizationId())
                && base.getBranchId().equals(recoveryCase.getBranchId())
                && java.util.Objects.equals(base.getPrincipalVehicleId(), recoveryCase.getPrincipalVehicleId())
                && java.util.Objects.equals(base.getPrincipalCustomerPersonId(), recoveryCase.getPrincipalCustomerPersonId());
        return isTodoRiesgoBase && copiedCaseSnapshot
                && caseRelationRepository.findBySourceCaseIdAndTargetCaseIdAndRelationTypeCode(
                        base.getId(), recoveryCase.getId(), "RECUPERO_DE").isPresent();
    }
    private boolean requiresLowerAgreementApproval(FranchiseRecoveryEntity recovery) { return recovery.getAgreedAmount() != null && recovery.getRecoveryAmount() != null && recovery.getRecoveryAmount().compareTo(recovery.getAgreedAmount()) < 0 && !"CULPA_COMPARTIDA".equals(normalizeCode(recovery.getOpinionCode())); }
    private void notifyGlobalAdminsOfLowerAgreement(FranchiseRecoveryEntity recovery, CaseEntity caseEntity, AuthenticatedUser actor) { for (Long adminId : userRoleRepository.findActiveGlobalUserIdsByRoleCode("ROLE_ADMIN")) { NotificationEntity notification = new NotificationEntity(); notification.setUserId(adminId); notification.setCaseId(caseEntity.getId()); notification.setTypeCode("RECUPERO_MONTO_MENOR"); notification.setTitle("Recupero requiere aprobación"); notification.setMessage("Carpeta " + caseEntity.getFolderCode() + ": monto a recuperar menor al acordado. Informado por " + actor.displayName()); notification.setActionUrl("/cases/" + caseEntity.getId()); notification.setEntityType("recupero_franquicia"); notification.setEntityId(recovery.getId()); notificationRepository.save(notification); } }
    private void registerSharedFaultCollectionOnce(FranchiseRecoveryEntity recovery, CaseEntity caseEntity, AuthenticatedUser user, HttpServletRequest request) { if (!"CULPA_COMPARTIDA".equals(normalizeCode(recovery.getOpinionCode())) || !"COBRADO".equals(normalizeCode(recovery.getClientPaymentStatusCode())) || recovery.getClientAmount() == null || recovery.getClientPaymentDate() == null) return; boolean exists = financialMovementRepository.findByCaseId(caseEntity.getId(), org.springframework.data.domain.Sort.unsorted()).stream().anyMatch(m -> "Cobro cliente por culpa compartida".equals(m.getReason())); if (exists) return; FinancialMovementEntity movement = new FinancialMovementEntity(); movement.setCaseId(caseEntity.getId()); movement.setMovementTypeCode("INGRESO"); movement.setFlowOriginCode("CLIENTE"); movement.setCounterpartyTypeCode("PERSONA"); movement.setCounterpartyPersonId(caseEntity.getPrincipalCustomerPersonId()); movement.setMovementAt(recovery.getClientPaymentDate().atStartOfDay()); movement.setGrossAmount(scale(recovery.getClientAmount())); movement.setNetAmount(scale(recovery.getClientAmount())); movement.setPaymentMethodCode("TRANSFERENCIA"); movement.setAdvancePayment(false); movement.setBonification(false); movement.setReason("Cobro cliente por culpa compartida"); movement.setRegisteredBy(user.id()); movement = financialMovementRepository.save(movement); caseAuditService.register(user.id(), caseEntity.getId(), "movimientos_financieros", movement.getId(), "crear_cobro_culpa_compartida", null, caseAuditService.toJson(Map.of("amount", movement.getNetAmount())), caseAuditService.toJson(Map.of("domain", "finanzas")), request); }
    private FranchiseRecoveryResponse toResponse(FranchiseRecoveryEntity e) { return new FranchiseRecoveryResponse(e.getId(), e.getCaseId(), e.getManagerCode(), e.getBaseCaseId(), e.getBaseFolderCode(), e.getOpinionCode(), e.getAgreedAmount(), e.getRecoveryAmount(), e.getEnablesRepair(), e.getRecoversClient(), e.getClientAmount(), e.getClientPaymentStatusCode(), e.getClientPaymentDate(), e.getApprovedLowerAgreement(), e.getApprovalNote(), e.getApprovedByUserId(), e.getApprovedAt(), e.getReusesBaseData()); }
    private String normalizeCode(String value) { return value == null || value.isBlank() ? null : value.trim().toUpperCase(); }
    private String normalizedOptionalCode(String value) { return value == null || value.isBlank() ? null : normalizeCode(value); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private BigDecimal scale(BigDecimal value) { return value == null ? null : value.setScale(2, RoundingMode.HALF_UP); }
}
