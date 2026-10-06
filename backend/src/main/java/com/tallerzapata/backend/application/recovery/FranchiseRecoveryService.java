package com.tallerzapata.backend.application.recovery;

import com.tallerzapata.backend.api.casefile.CodeCatalogResponse;
import com.tallerzapata.backend.api.recovery.FranchiseRecoveryCatalogsResponse;
import com.tallerzapata.backend.api.recovery.FranchiseRecoveryResponse;
import com.tallerzapata.backend.api.recovery.FranchiseRecoveryClientObligationResponse;
import com.tallerzapata.backend.api.recovery.FranchiseRecoveryClientObligationPaymentApplicationResponse;
import com.tallerzapata.backend.api.recovery.FranchiseRecoveryClientObligationPaymentAnnulmentRequest;
import com.tallerzapata.backend.api.recovery.FranchiseRecoveryClientObligationPaymentRequest;
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
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseIncidentEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseIncidentRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseInsuranceRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseInsuranceEntity;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseThirdPartyRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.CaseThirdPartyEntity;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.vehicle.VehicleRepository;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetRepository;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementEntity;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialPaymentMethodRepository;
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
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
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
    private final CaseIncidentRepository caseIncidentRepository;
    private final CaseInsuranceRepository caseInsuranceRepository;
    private final CaseThirdPartyRepository caseThirdPartyRepository;
    private final PersonRepository personRepository;
    private final VehicleRepository vehicleRepository;
    private final BudgetRepository budgetRepository;
    private final CasePartRepository casePartRepository;
    private final FranchiseRecoveryClientObligationRepository clientObligationRepository;
    private final FranchiseRecoveryClientObligationPaymentApplicationRepository clientObligationPaymentApplicationRepository;
    private final FinancialPaymentMethodRepository financialPaymentMethodRepository;

    public FranchiseRecoveryService(FranchiseRecoveryRepository franchiseRecoveryRepository, FranchiseRecoveryManagerRepository managerRepository, FranchiseRecoveryOpinionRepository opinionRepository, FranchiseRecoveryPaymentStatusRepository paymentStatusRepository, CaseRepository caseRepository, CaseTypeRepository caseTypeRepository, CaseRelationRepository caseRelationRepository, CaseService caseService, CurrentUserService currentUserService, CaseAccessControlService accessControlService, CaseAuditService caseAuditService, FinancialMovementRepository financialMovementRepository, NotificationRepository notificationRepository, UserRoleRepository userRoleRepository, CaseIncidentRepository caseIncidentRepository, CaseInsuranceRepository caseInsuranceRepository, CaseThirdPartyRepository caseThirdPartyRepository, PersonRepository personRepository, VehicleRepository vehicleRepository, BudgetRepository budgetRepository, CasePartRepository casePartRepository, FranchiseRecoveryClientObligationRepository clientObligationRepository, FranchiseRecoveryClientObligationPaymentApplicationRepository clientObligationPaymentApplicationRepository, FinancialPaymentMethodRepository financialPaymentMethodRepository) {
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
        this.caseIncidentRepository = caseIncidentRepository;
        this.caseInsuranceRepository = caseInsuranceRepository; this.caseThirdPartyRepository = caseThirdPartyRepository;
        this.personRepository = personRepository; this.vehicleRepository = vehicleRepository; this.budgetRepository = budgetRepository; this.casePartRepository = casePartRepository;
        this.clientObligationRepository = clientObligationRepository;
        this.clientObligationPaymentApplicationRepository = clientObligationPaymentApplicationRepository;
        this.financialPaymentMethodRepository = financialPaymentMethodRepository;
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
        FranchiseRecoveryEntity entity = franchiseRecoveryRepository.findByCaseId(caseId).orElseGet(() -> newRecovery(caseId));
        validateRequest(caseEntity, entity, request);
        entity.setCaseId(caseId);
        associateBaseCaseIfRequested(entity, request);
        entity.setManagerCode(normalizedOptionalCode(request.managerCode()));
        entity.setOpinionCode(normalizedOptionalCode(request.opinionCode()));
        entity.setPresentedAt(request.presentedAt());
        entity.setInspectionForwardedAt(request.inspectionForwardedAt()); entity.setInspectionDate(request.inspectionDate());
        entity.setModalityCode(normalizedOptionalCode(request.modalityCode())); entity.setQuotationStatusCode(normalizedOptionalCode(request.quotationStatusCode())); entity.setQuotationDate(request.quotationDate());
        entity.setIncludesParts(Boolean.TRUE.equals(request.includesParts())); entity.setRepairsVehicle(Boolean.TRUE.equals(request.repairsVehicle())); entity.setPartsProvisionModeCode(normalizedOptionalCode(request.partsProvisionModeCode()));
        updateIncidentDate(caseId, request.incidentDate());
        entity.setAgreedAmount(scale(request.agreedAmount()));
        entity.setRecoveryAmount(scale(request.recoveryAmount()));
        entity.setEnablesRepair(Boolean.TRUE.equals(request.enablesRepair()));
        boolean sharedFault = "CULPA_COMPARTIDA".equals(normalizedOptionalCode(request.opinionCode()));
        entity.setRecoversClient(sharedFault || (!Boolean.TRUE.equals(request.enablesRepair()) && Boolean.TRUE.equals(request.recoversClient())));
        if (Boolean.TRUE.equals(entity.getRecoversClient()) || request.clientAmount() != null || request.clientPaymentStatusCode() != null || request.clientPaymentDate() != null) {
            entity.setClientAmount(sharedFault && request.recoveryAmount() != null
                    ? scale(request.recoveryAmount().divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP))
                    : scale(request.clientAmount()));
            entity.setClientPaymentStatusCode(normalizedOptionalCode(request.clientPaymentStatusCode()));
            entity.setClientPaymentDate(request.clientPaymentDate());
        }
        // La aprobación es una acción privilegiada separada. Nunca proviene del formulario del operador.
        if (!requiresLowerAgreementApproval(entity)) {
            entity.setApprovedLowerAgreement(false);
            entity.setApprovalNote(null);
            entity.setApprovedByUserId(null);
            entity.setApprovedAt(null);
        }
        entity.setReusesBaseData(entity.getBaseCaseId() != null && hasCompatibleBaseSnapshot(entity, caseEntity));
        entity = franchiseRecoveryRepository.save(entity);
        synchronizeClientObligations(entity);
        if (Boolean.TRUE.equals(entity.getEnablesRepair())) caseService.copyRecoveryBudgetFromBase(entity.getBaseCaseId(), caseId);
        if (requiresLowerAgreementApproval(entity) && !Boolean.TRUE.equals(entity.getApprovedLowerAgreement())) {
            notifyGlobalAdminsOfLowerAgreement(entity, caseEntity, currentUser);
        }
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
        recovery.setBaseFolderName(personRepository.findById(base.getPrincipalCustomerPersonId()).map(person -> person.getNombreMostrar()).orElse("Todo Riesgo"));
        recovery.setBaseFolderSnapshot(baseSnapshot(base).toString());
        copyAssociatedInsuranceData(base.getId(), recovery.getCaseId());
        copyAssociatedIncidentData(base.getId(), recovery.getCaseId());
        recovery.setReusesBaseData(true);
        recovery.setEnablesRepair(false);
        recovery.setRecoversClient(false);
        recovery.setApprovedLowerAgreement(false);
        franchiseRecoveryRepository.save(recovery);
        copyAssociatedInsuranceData(baseCaseId, child.getId());

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
    private void copyAssociatedInsuranceData(Long baseCaseId, Long recoveryCaseId) {
        if (caseInsuranceRepository.findByCaseId(recoveryCaseId).isEmpty()) caseInsuranceRepository.findByCaseId(baseCaseId).ifPresent(source -> {
            CaseInsuranceEntity copy = new CaseInsuranceEntity(); copy.setCaseId(recoveryCaseId); copy.setInsuranceCompanyId(source.getInsuranceCompanyId()); copy.setPolicyNumber(source.getPolicyNumber()); copy.setCertificateNumber(source.getCertificateNumber()); copy.setCoverageDetail(source.getCoverageDetail()); copy.setThirdPartyCompanyId(source.getThirdPartyCompanyId()); copy.setCleasNumber(source.getCleasNumber()); copy.setClaimNumber(source.getClaimNumber()); caseInsuranceRepository.save(copy);
        });
        if (caseThirdPartyRepository.findByCaseId(recoveryCaseId).isEmpty()) caseThirdPartyRepository.findByCaseId(baseCaseId).ifPresent(source -> {
            CaseThirdPartyEntity copy = new CaseThirdPartyEntity(); copy.setCaseId(recoveryCaseId); copy.setThirdPartyCompanyId(source.getThirdPartyCompanyId()); copy.setClaimReference(source.getClaimReference()); copy.setDocumentationAccepted(false); caseThirdPartyRepository.save(copy);
        });
    }
    private void copyAssociatedIncidentData(Long baseCaseId, Long recoveryCaseId) {
        if (caseIncidentRepository.findByCaseId(recoveryCaseId).isPresent()) return;
        caseIncidentRepository.findByCaseId(baseCaseId).ifPresent(source -> {
            CaseIncidentEntity copy = new CaseIncidentEntity(); copy.setCaseId(recoveryCaseId); copy.setIncidentDate(source.getIncidentDate()); copy.setIncidentTime(source.getIncidentTime()); copy.setLugar(source.getLugar()); copy.setDinamica(source.getDinamica()); copy.setObservaciones(source.getObservaciones()); caseIncidentRepository.save(copy);
        });
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
            BigDecimal expectedClientAmount = scale(request.recoveryAmount().divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP));
            if (request.clientAmount() != null && scale(request.clientAmount()).compareTo(expectedClientAmount) != 0) throw new ConflictException("Con culpa compartida el cliente debe asumir exactamente el 50% del monto a recuperar");
        } else if (!Boolean.TRUE.equals(request.enablesRepair()) && Boolean.TRUE.equals(request.recoversClient())) {
            if (request.clientAmount() == null || request.clientAmount().signum() <= 0) throw new ConflictException("El monto a reintegrar al cliente debe ser mayor a cero");
            if (request.recoveryAmount() == null || request.clientAmount().compareTo(request.recoveryAmount()) > 0) throw new ConflictException("El monto a reintegrar no puede superar el monto a recuperar");
        }
        if (entity.getBaseCaseId() != null && request.baseCaseId() != null && !request.baseCaseId().equals(entity.getBaseCaseId())) throw new ConflictException("La carpeta asociada del recupero no puede modificarse");
        if (entity.getBaseCaseId() != null) {
            CaseEntity base = requireCase(entity.getBaseCaseId());
            requireTodoRiesgoBase(base);
            if (!base.getFolderCode().equals(entity.getBaseFolderCode())) throw new ConflictException("La carpeta asociada no coincide con el recupero");
        }
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
    private FranchiseRecoveryEntity newRecovery(Long caseId) { FranchiseRecoveryEntity entity = new FranchiseRecoveryEntity(); entity.setCaseId(caseId); entity.setEnablesRepair(false); entity.setRecoversClient(false); entity.setIncludesParts(false); entity.setRepairsVehicle(false); entity.setApprovedLowerAgreement(false); entity.setReusesBaseData(false); return entity; }
    private void associateBaseCaseIfRequested(FranchiseRecoveryEntity recovery, FranchiseRecoveryUpsertRequest request) {
        if (recovery.getBaseCaseId() != null || request.baseCaseId() == null) return;
        CaseEntity base = requireCase(request.baseCaseId());
        requireTodoRiesgoBase(base);
        recovery.setBaseCaseId(base.getId());
        recovery.setBaseFolderCode(base.getFolderCode());
        recovery.setBaseFolderName(personRepository.findById(base.getPrincipalCustomerPersonId()).map(person -> person.getNombreMostrar()).orElse("Todo Riesgo"));
        recovery.setBaseFolderSnapshot(baseSnapshot(base).toString());
        copyAssociatedInsuranceData(base.getId(), recovery.getCaseId());
        copyAssociatedIncidentData(base.getId(), recovery.getCaseId());
        CaseRelationEntity relation = new CaseRelationEntity(); relation.setSourceCaseId(base.getId()); relation.setTargetCaseId(recovery.getCaseId()); relation.setRelationTypeCode("RECUPERO_DE"); relation.setDescription("Recupero de franquicia de la carpeta " + base.getFolderCode()); caseRelationRepository.save(relation);
    }
    private LinkedHashMap<String, Object> baseSnapshot(CaseEntity base) {
        LinkedHashMap<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("folderCode", base.getFolderCode()); snapshot.put("customer", personRepository.findById(base.getPrincipalCustomerPersonId()).map(person -> person.getNombreMostrar()).orElse(null));
        snapshot.put("vehicle", vehicleRepository.findById(base.getPrincipalVehicleId()).map(vehicle -> vehicle.getPlate()).orElse(null));
        caseInsuranceRepository.findByCaseId(base.getId()).ifPresent(insurance -> { snapshot.put("insuranceCompanyId", insurance.getInsuranceCompanyId()); snapshot.put("thirdPartyCompanyId", insurance.getThirdPartyCompanyId()); snapshot.put("claimNumber", insurance.getClaimNumber()); });
        caseThirdPartyRepository.findByCaseId(base.getId()).ifPresent(thirdParty -> { snapshot.put("thirdPartyCompanyId", thirdParty.getThirdPartyCompanyId()); snapshot.put("claimReference", thirdParty.getClaimReference()); });
        caseIncidentRepository.findByCaseId(base.getId()).ifPresent(incident -> { snapshot.put("incidentDate", incident.getIncidentDate()); snapshot.put("incidentPlace", incident.getLugar()); snapshot.put("incidentDynamics", incident.getDinamica()); });
        budgetRepository.findByCaseId(base.getId()).ifPresent(budget -> { snapshot.put("budgetDate", budget.getBudgetDate()); snapshot.put("budgetTotal", budget.getTotalQuoted()); snapshot.put("budgetObservations", budget.getObservations()); });
        snapshot.put("capturedAt", LocalDateTime.now().toString()); return snapshot;
    }
    private void updateIncidentDate(Long caseId, LocalDate incidentDate) { if (incidentDate == null) return; CaseIncidentEntity incident = caseIncidentRepository.findByCaseId(caseId).orElseGet(CaseIncidentEntity::new); incident.setCaseId(caseId); incident.setIncidentDate(incidentDate); caseIncidentRepository.save(incident); }
    private FranchiseRecoveryResponse toResponse(FranchiseRecoveryEntity e) { CaseEntity caseEntity = requireCase(e.getCaseId()); LocalDate incidentDate = caseIncidentRepository.findByCaseId(e.getCaseId()).map(CaseIncidentEntity::getIncidentDate).orElse(null); LocalDate presentedAt = e.getPresentedAt(); LocalDate prescriptionDate = presentedAt == null ? null : presentedAt.plusYears(3); Integer daysInProcess = presentedAt == null ? null : (int) ChronoUnit.DAYS.between(presentedAt, caseEntity.getClosedAt() == null ? LocalDate.now() : caseEntity.getClosedAt().toLocalDate()); RecoveryAmounts amounts = calculateRecoveryAmounts(e); return new FranchiseRecoveryResponse(e.getId(), e.getCaseId(), e.getManagerCode(), e.getBaseCaseId(), e.getBaseFolderCode(), e.getOpinionCode(), e.getAgreedAmount(), e.getRecoveryAmount(), e.getEnablesRepair(), e.getRecoversClient(), e.getClientAmount(), e.getClientPaymentStatusCode(), e.getClientPaymentDate(), e.getApprovedLowerAgreement(), e.getApprovalNote(), e.getApprovedByUserId(), e.getApprovedAt(), e.getReusesBaseData(), incidentDate, presentedAt, prescriptionDate, daysInProcess, e.getBaseFolderName(), e.getInspectionForwardedAt(), e.getInspectionDate(), e.getModalityCode(), e.getQuotationStatusCode(), e.getQuotationDate(), e.getIncludesParts(), e.getRepairsVehicle(), e.getPartsProvisionModeCode(), amounts.minimumLabor(), amounts.minimumParts(), amounts.finalParts(), amounts.amountToBillCompany(), amounts.finalAmountForWorkshop()); }
    private RecoveryAmounts calculateRecoveryAmounts(FranchiseRecoveryEntity recovery) {
        BudgetEntity budget = budgetRepository.findByCaseId(recovery.getCaseId()).orElse(null);
        BigDecimal minimumLabor = budget == null ? null : scale(budget.getLaborWithoutVat());
        BigDecimal minimumParts = budget == null ? null : scale(budget.getPartsTotal());
        BigDecimal finalParts = casePartRepository.findByCaseIdOrderByIdAsc(recovery.getCaseId()).stream()
                .filter(part -> !Boolean.TRUE.equals(part.getReturned()))
                .filter(part -> !"DEVOLVER".equals(normalizeCode(part.getStatusCode())) && !"DEVUELTO".equals(normalizeCode(part.getStatusCode())))
                .map(CasePartEntity::getFinalPrice).filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal amountToBill = recovery.getAgreedAmount() != null ? scale(recovery.getAgreedAmount()) : budget == null ? null : scale(budget.getTotalQuoted());
        BigDecimal finalPartsAmount = "TALLER".equals(normalizeCode(recovery.getPartsProvisionModeCode())) ? scale(finalParts) : null;
        BigDecimal finalForWorkshop = amountToBill == null ? null : finalPartsAmount == null ? amountToBill : scale(amountToBill.subtract(finalPartsAmount));
        return new RecoveryAmounts(minimumLabor, minimumParts, finalPartsAmount, amountToBill, finalForWorkshop);
    }
    private record RecoveryAmounts(BigDecimal minimumLabor, BigDecimal minimumParts, BigDecimal finalParts, BigDecimal amountToBillCompany, BigDecimal finalAmountForWorkshop) { }
    @Transactional(readOnly = true)
    public List<FranchiseRecoveryClientObligationResponse> listClientObligations(Long caseId) {
        AuthenticatedUser user = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(user, caseEntity, "recupero.ver");
        requireRecoveryCase(caseEntity);
        return clientObligationRepository.findByCaseIdOrderByIdAsc(caseId).stream().map(this::toObligationResponse).toList();
    }

    @Transactional
    public FranchiseRecoveryClientObligationResponse applyClientObligationPayment(Long caseId, Long obligationId, String idempotencyKey, FranchiseRecoveryClientObligationPaymentRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser user = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(user, caseEntity, "recupero.crear");
        requireRecoveryCase(caseEntity);
        String normalizedIdempotencyKey = requireIdempotencyKey(idempotencyKey);
        FranchiseRecoveryClientObligationEntity obligation = requireObligationForUpdate(caseId, obligationId);
        var existing = clientObligationPaymentApplicationRepository.findByObligationIdAndIdempotencyKey(obligationId, normalizedIdempotencyKey);
        if (existing.isPresent()) return toObligationResponse(obligation);
        if (!"ACTIVA".equals(obligation.getStatusCode())) throw new ConflictException("La obligación del cliente no está activa");
        BigDecimal amount = money(request == null ? null : request.amount());
        if (amount.signum() <= 0) throw new ConflictException("El importe aplicado debe ser positivo");
        BigDecimal outstanding = derivedOutstandingAmount(obligation);
        if (amount.compareTo(outstanding) > 0) throw new ConflictException("El importe supera el saldo vigente de la obligación");
        String paymentMethodCode = normalizedOptionalCode(request.paymentMethodCode());
        if (paymentMethodCode == null || !financialPaymentMethodRepository.existsByCodeAndActiveTrue(paymentMethodCode)) throw new ConflictException("paymentMethodCode no permitido: " + request.paymentMethodCode());

        FinancialMovementEntity movement = new FinancialMovementEntity();
        movement.setCaseId(caseId);
        movement.setMovementTypeCode("APORTE_CLIENTE_CULPA_COMPARTIDA".equals(obligation.getTypeCode()) ? "INGRESO" : "EGRESO");
        movement.setFlowOriginCode("CLIENTE");
        movement.setCounterpartyTypeCode("PERSONA");
        movement.setCounterpartyPersonId(caseEntity.getPrincipalCustomerPersonId());
        movement.setMovementAt(request.movementAt() == null ? LocalDateTime.now() : request.movementAt());
        movement.setGrossAmount(amount);
        movement.setNetAmount(amount);
        movement.setPaymentMethodCode(paymentMethodCode);
        movement.setPaymentMethodDetail(blankToNull(request.paymentMethodDetail()));
        movement.setCancellationTypeCode("FRANQUICIA");
        movement.setAdvancePayment(false);
        movement.setBonification(false);
        movement.setExternalReference(blankToNull(request.externalReference()));
        movement.setReason(blankToNull(request.reason()) == null ? "Aplicación de obligación de recupero de franquicia" : blankToNull(request.reason()));
        movement.setRegisteredBy(user.id());
        movement = financialMovementRepository.saveAndFlush(movement);

        FranchiseRecoveryClientObligationPaymentApplicationEntity application = new FranchiseRecoveryClientObligationPaymentApplicationEntity();
        application.setObligationId(obligationId);
        application.setMovementId(movement.getId());
        application.setAppliedAmount(amount);
        application.setIdempotencyKey(normalizedIdempotencyKey);
        application.setStatusCode("APLICADA");
        application.setCreatedAt(LocalDateTime.now());
        clientObligationPaymentApplicationRepository.saveAndFlush(application);
        refreshOutstandingAmount(obligation);
        caseAuditService.register(user.id(), caseId, "recupero_obligacion_pago_aplicaciones", application.getId(), "aplicar_pago_obligacion_cliente_recupero", null,
                caseAuditService.toJson(Map.of("obligationId", obligationId, "movementId", movement.getId(), "amount", amount)), caseAuditService.toJson(Map.of("domain", "recovery")), httpRequest);
        return toObligationResponse(obligation);
    }

    @Transactional
    public FranchiseRecoveryClientObligationResponse annulClientObligationPayment(Long caseId, Long obligationId, Long applicationId, FranchiseRecoveryClientObligationPaymentAnnulmentRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser user = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(user, caseEntity, "recupero.crear");
        requireRecoveryCase(caseEntity);
        FranchiseRecoveryClientObligationEntity obligation = requireObligationForUpdate(caseId, obligationId);
        FranchiseRecoveryClientObligationPaymentApplicationEntity original = clientObligationPaymentApplicationRepository.findByIdAndObligationId(applicationId, obligationId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe la aplicación de pago de la obligación"));
        if (original.getAppliedAmount().signum() <= 0 || !"APLICADA".equals(original.getStatusCode())) throw new ConflictException("Sólo puede anularse una aplicación de pago vigente");
        if (clientObligationPaymentApplicationRepository.existsByReversedApplicationId(applicationId)) throw new ConflictException("La aplicación de pago ya fue anulada");
        FinancialMovementEntity originalMovement = financialMovementRepository.findById(original.getMovementId())
                .filter(item -> caseId.equals(item.getCaseId()))
                .orElseThrow(() -> new ResourceNotFoundException("No existe el movimiento financiero de la aplicación"));

        FinancialMovementEntity reversal = new FinancialMovementEntity();
        reversal.setCaseId(caseId);
        reversal.setMovementTypeCode("INGRESO".equals(originalMovement.getMovementTypeCode()) ? "EGRESO" : "INGRESO");
        reversal.setFlowOriginCode("CLIENTE");
        reversal.setCounterpartyTypeCode("PERSONA");
        reversal.setCounterpartyPersonId(originalMovement.getCounterpartyPersonId());
        reversal.setMovementAt(LocalDateTime.now());
        reversal.setGrossAmount(original.getAppliedAmount());
        reversal.setNetAmount(original.getAppliedAmount());
        reversal.setPaymentMethodCode(originalMovement.getPaymentMethodCode());
        reversal.setPaymentMethodDetail(originalMovement.getPaymentMethodDetail());
        reversal.setCancellationTypeCode("FRANQUICIA");
        reversal.setAdvancePayment(false);
        reversal.setBonification(false);
        reversal.setExternalReference(originalMovement.getPublicId());
        reversal.setReason(request == null || blankToNull(request.reason()) == null ? "Anulación de aplicación de obligación de recupero" : blankToNull(request.reason()));
        reversal.setRegisteredBy(user.id());
        reversal = financialMovementRepository.saveAndFlush(reversal);

        original.setStatusCode("ANULADA");
        original.setAnnulledAt(LocalDateTime.now());
        clientObligationPaymentApplicationRepository.save(original);
        FranchiseRecoveryClientObligationPaymentApplicationEntity reversalApplication = new FranchiseRecoveryClientObligationPaymentApplicationEntity();
        reversalApplication.setObligationId(obligationId);
        reversalApplication.setMovementId(reversal.getId());
        reversalApplication.setAppliedAmount(original.getAppliedAmount().negate());
        reversalApplication.setIdempotencyKey("ANNUL-" + applicationId);
        reversalApplication.setStatusCode("REVERSO");
        reversalApplication.setReversedApplicationId(applicationId);
        reversalApplication.setCreatedAt(LocalDateTime.now());
        clientObligationPaymentApplicationRepository.saveAndFlush(reversalApplication);
        refreshOutstandingAmount(obligation);
        caseAuditService.register(user.id(), caseId, "recupero_obligacion_pago_aplicaciones", reversalApplication.getId(), "anular_pago_obligacion_cliente_recupero", null,
                caseAuditService.toJson(Map.of("obligationId", obligationId, "applicationId", applicationId, "reversalMovementId", reversal.getId())), caseAuditService.toJson(Map.of("domain", "recovery")), httpRequest);
        return toObligationResponse(obligation);
    }

    private FranchiseRecoveryClientObligationEntity requireObligationForUpdate(Long caseId, Long obligationId) {
        FranchiseRecoveryClientObligationEntity obligation = clientObligationRepository.findByIdForUpdate(obligationId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe la obligación del cliente"));
        if (!caseId.equals(obligation.getCaseId())) throw new ResourceNotFoundException("La obligación no pertenece al recupero indicado");
        return obligation;
    }

    private void synchronizeClientObligations(FranchiseRecoveryEntity recovery) {
        boolean sharedFault = "CULPA_COMPARTIDA".equals(normalizeCode(recovery.getOpinionCode()));
        sync(recovery, "REINTEGRO_A_CLIENTE", "PAGAR_A_CLIENTE", !sharedFault && Boolean.TRUE.equals(recovery.getRecoversClient()) && !Boolean.TRUE.equals(recovery.getEnablesRepair()), recovery.getClientAmount(), "Ya no aplica recupero a favor del cliente");
        sync(recovery, "APORTE_CLIENTE_CULPA_COMPARTIDA", "COBRAR_A_CLIENTE", sharedFault, recovery.getClientAmount(), "El dictamen dejó de ser culpa compartida");
    }

    private void sync(FranchiseRecoveryEntity recovery, String type, String direction, boolean applies, BigDecimal amount, String reason) {
        FranchiseRecoveryClientObligationEntity existing = clientObligationRepository.findByCaseIdAndTypeCode(recovery.getCaseId(), type).orElse(null);
        if (!applies) {
            if (existing != null && "ACTIVA".equals(existing.getStatusCode())) {
                existing.setStatusCode("INACTIVA");
                existing.setInactivatedAt(LocalDateTime.now());
                existing.setInactivationReason(reason);
                existing.setUpdatedAt(LocalDateTime.now());
                clientObligationRepository.save(existing);
            }
            return;
        }
        if (amount == null) return;
        FranchiseRecoveryClientObligationEntity obligation = existing == null ? new FranchiseRecoveryClientObligationEntity() : existing;
        BigDecimal originalAmount = scale(amount);
        if (existing != null && !applicationsFor(obligation).isEmpty() && originalAmount.compareTo(appliedAmount(obligation)) < 0) {
            throw new ConflictException("El importe de la obligación no puede ser menor a lo ya aplicado");
        }
        obligation.setCaseId(recovery.getCaseId());
        obligation.setTypeCode(type);
        obligation.setDirectionCode(direction);
        obligation.setOriginalAmount(originalAmount);
        if (existing == null) obligation.setOutstandingAmount(originalAmount);
        obligation.setStatusCode("ACTIVA");
        obligation.setUpdatedAt(LocalDateTime.now());
        obligation.setInactivatedAt(null);
        obligation.setInactivationReason(null);
        if (existing == null) obligation.setCreatedAt(LocalDateTime.now());
        clientObligationRepository.save(obligation);
        refreshOutstandingAmount(obligation);
    }

    private void refreshOutstandingAmount(FranchiseRecoveryClientObligationEntity obligation) {
        obligation.setOutstandingAmount(derivedOutstandingAmount(obligation));
        obligation.setUpdatedAt(LocalDateTime.now());
        clientObligationRepository.save(obligation);
    }

    private BigDecimal derivedOutstandingAmount(FranchiseRecoveryClientObligationEntity obligation) {
        return scale(obligation.getOriginalAmount().subtract(appliedAmount(obligation)));
    }

    private BigDecimal appliedAmount(FranchiseRecoveryClientObligationEntity obligation) {
        return applicationsFor(obligation).stream().map(FranchiseRecoveryClientObligationPaymentApplicationEntity::getAppliedAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private List<FranchiseRecoveryClientObligationPaymentApplicationEntity> applicationsFor(FranchiseRecoveryClientObligationEntity obligation) {
        return clientObligationPaymentApplicationRepository.findByObligationIdOrderByIdAsc(obligation.getId());
    }

    private FranchiseRecoveryClientObligationResponse toObligationResponse(FranchiseRecoveryClientObligationEntity obligation) {
        List<FranchiseRecoveryClientObligationPaymentApplicationEntity> applications = applicationsFor(obligation);
        return new FranchiseRecoveryClientObligationResponse(obligation.getId(), obligation.getTypeCode(), obligation.getDirectionCode(), obligation.getOriginalAmount(), scale(obligation.getOriginalAmount().subtract(applications.stream().map(FranchiseRecoveryClientObligationPaymentApplicationEntity::getAppliedAmount).reduce(BigDecimal.ZERO, BigDecimal::add))), obligation.getStatusCode(), obligation.getCreatedAt(), obligation.getUpdatedAt(), obligation.getInactivatedAt(), obligation.getInactivationReason(), applications.stream().map(application -> new FranchiseRecoveryClientObligationPaymentApplicationResponse(application.getId(), application.getMovementId(), application.getAppliedAmount(), application.getStatusCode(), application.getReversedApplicationId(), application.getIdempotencyKey(), application.getCreatedAt(), application.getAnnulledAt())).toList());
    }

    private String requireIdempotencyKey(String value) {
        String key = blankToNull(value);
        if (key == null) throw new ConflictException("Idempotency-Key es obligatorio");
        if (key.length() > 100) throw new ConflictException("Idempotency-Key supera los 100 caracteres");
        return key;
    }

    private BigDecimal money(BigDecimal value) {
        if (value == null) throw new ConflictException("El importe es obligatorio");
        return scale(value);
    }
    private String normalizeCode(String value) { return value == null || value.isBlank() ? null : value.trim().toUpperCase(); }
    private String normalizedOptionalCode(String value) { return value == null || value.isBlank() ? null : normalizeCode(value); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private BigDecimal scale(BigDecimal value) { return value == null ? null : value.setScale(2, RoundingMode.HALF_UP); }
}
