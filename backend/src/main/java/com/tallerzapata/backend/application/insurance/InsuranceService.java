package com.tallerzapata.backend.application.insurance;

import com.tallerzapata.backend.api.insurance.*;
import com.tallerzapata.backend.application.casefile.CaseAuditService;
import com.tallerzapata.backend.application.casefile.InsuranceRepairCasePolicy;
import com.tallerzapata.backend.application.casefile.todoriskstate.TodoRiesgoEffectiveStateRecalculator;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.DomainConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.recovery.FranchiseRecoveryService;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CasePersonEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CasePersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetItemEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetItemRepository;
import com.tallerzapata.backend.infrastructure.persistence.budget.BudgetRepository;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartEntity;
import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementEntity;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialMovementRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.*;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.provider.ProviderRepository;
import com.tallerzapata.backend.infrastructure.persistence.todoriskstate.TodoRiesgoStateFactsRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class InsuranceService {
    private final InsuranceRepairCasePolicy insuranceRepairCasePolicy = new InsuranceRepairCasePolicy();
    private final InsuranceCompanyRepository companyRepository;
    private final InsuranceCompanyContactRepository companyContactRepository;
    private final InsuranceRoleContactRepository roleContactRepository;
    private final PersonRepository personRepository;
    private final CaseRepository caseRepository;
    private final CaseTypeRepository caseTypeRepository;
    private final CasePersonRepository casePersonRepository;
    private final CaseInsuranceRepository caseInsuranceRepository;
    private final InsuranceProcessingRepository insuranceProcessingRepository;
    private final CaseFranchiseRepository caseFranchiseRepository;
    private final InsuranceModalityRepository modalityRepository;
    private final InsuranceOpinionRepository opinionRepository;
    private final InsuranceQuotationStatusRepository quotationStatusRepository;
    private final InsurancePartsAuthorizationRepository partsAuthorizationRepository;
    private final FranchiseStatusRepository franchiseStatusRepository;
    private final FranchiseRecoveryTypeRepository franchiseRecoveryTypeRepository;
    private final FranchiseOpinionRepository franchiseOpinionRepository;
    private final CaseCleasRepository caseCleasRepository;
    private final CaseThirdPartyRepository caseThirdPartyRepository;
    private final CleasScopeRepository cleasScopeRepository;
    private final CleasOpinionRepository cleasOpinionRepository;
    private final PaymentStatusRepository paymentStatusRepository;
    private final ThirdPartyDocumentationStatusRepository thirdPartyDocumentationStatusRepository;
    private final PartsProvisionModeRepository partsProvisionModeRepository;
    private final CaseLegalRepository caseLegalRepository;
    private final LegalNewsRepository legalNewsRepository;
    private final LegalExpenseRepository legalExpenseRepository;
    private final LegalProcessorRepository legalProcessorRepository;
    private final LegalClaimantRepository legalClaimantRepository;
    private final LegalInstanceRepository legalInstanceRepository;
    private final LegalClosureReasonRepository legalClosureReasonRepository;
    private final LegalExpensePayerRepository legalExpensePayerRepository;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService accessControlService;
    private final CaseAuditService caseAuditService;
    private final TodoRiesgoStateFactsRepository todoRiesgoStateFactsRepository;
    private final ProviderRepository providerRepository;
    private final BudgetRepository budgetRepository;
    private final BudgetItemRepository budgetItemRepository;
    private final CasePartRepository casePartRepository;
    private final FranchiseRecoveryService franchiseRecoveryService;

    public InsuranceService(InsuranceCompanyRepository companyRepository, InsuranceCompanyContactRepository companyContactRepository, InsuranceRoleContactRepository roleContactRepository, PersonRepository personRepository, CaseRepository caseRepository, CaseTypeRepository caseTypeRepository, CasePersonRepository casePersonRepository, CaseInsuranceRepository caseInsuranceRepository, InsuranceProcessingRepository insuranceProcessingRepository, CaseFranchiseRepository caseFranchiseRepository, InsuranceModalityRepository modalityRepository, InsuranceOpinionRepository opinionRepository, InsuranceQuotationStatusRepository quotationStatusRepository, InsurancePartsAuthorizationRepository partsAuthorizationRepository, FranchiseStatusRepository franchiseStatusRepository, FranchiseRecoveryTypeRepository franchiseRecoveryTypeRepository, FranchiseOpinionRepository franchiseOpinionRepository, CaseCleasRepository caseCleasRepository, CaseThirdPartyRepository caseThirdPartyRepository, CleasScopeRepository cleasScopeRepository, CleasOpinionRepository cleasOpinionRepository, PaymentStatusRepository paymentStatusRepository, ThirdPartyDocumentationStatusRepository thirdPartyDocumentationStatusRepository, PartsProvisionModeRepository partsProvisionModeRepository, CaseLegalRepository caseLegalRepository, LegalNewsRepository legalNewsRepository, LegalExpenseRepository legalExpenseRepository, LegalProcessorRepository legalProcessorRepository, LegalClaimantRepository legalClaimantRepository, LegalInstanceRepository legalInstanceRepository, LegalClosureReasonRepository legalClosureReasonRepository, LegalExpensePayerRepository legalExpensePayerRepository, CurrentUserService currentUserService, CaseAccessControlService accessControlService, CaseAuditService caseAuditService, TodoRiesgoEffectiveStateRecalculator todoRiesgoEffectiveStateRecalculator, TodoRiesgoStateFactsRepository todoRiesgoStateFactsRepository, ProviderRepository providerRepository, BudgetRepository budgetRepository, BudgetItemRepository budgetItemRepository, CasePartRepository casePartRepository, FranchiseRecoveryService franchiseRecoveryService) {
        this.companyRepository = companyRepository;
        this.companyContactRepository = companyContactRepository;
        this.roleContactRepository = roleContactRepository;
        this.personRepository = personRepository;
        this.caseRepository = caseRepository;
        this.caseTypeRepository = caseTypeRepository;
        this.casePersonRepository = casePersonRepository;
        this.caseInsuranceRepository = caseInsuranceRepository;
        this.insuranceProcessingRepository = insuranceProcessingRepository;
        this.caseFranchiseRepository = caseFranchiseRepository;
        this.modalityRepository = modalityRepository;
        this.opinionRepository = opinionRepository;
        this.quotationStatusRepository = quotationStatusRepository;
        this.partsAuthorizationRepository = partsAuthorizationRepository;
        this.franchiseStatusRepository = franchiseStatusRepository;
        this.franchiseRecoveryTypeRepository = franchiseRecoveryTypeRepository;
        this.franchiseOpinionRepository = franchiseOpinionRepository;
        this.caseCleasRepository = caseCleasRepository;
        this.caseThirdPartyRepository = caseThirdPartyRepository;
        this.cleasScopeRepository = cleasScopeRepository;
        this.cleasOpinionRepository = cleasOpinionRepository;
        this.paymentStatusRepository = paymentStatusRepository;
        this.thirdPartyDocumentationStatusRepository = thirdPartyDocumentationStatusRepository;
        this.partsProvisionModeRepository = partsProvisionModeRepository;
        this.caseLegalRepository = caseLegalRepository;
        this.legalNewsRepository = legalNewsRepository;
        this.legalExpenseRepository = legalExpenseRepository;
        this.legalProcessorRepository = legalProcessorRepository;
        this.legalClaimantRepository = legalClaimantRepository;
        this.legalInstanceRepository = legalInstanceRepository;
        this.legalClosureReasonRepository = legalClosureReasonRepository;
        this.legalExpensePayerRepository = legalExpensePayerRepository;
        this.currentUserService = currentUserService;
        this.accessControlService = accessControlService;
        this.caseAuditService = caseAuditService;
        this.todoRiesgoStateFactsRepository = todoRiesgoStateFactsRepository;
        this.providerRepository = providerRepository;
        this.budgetRepository = budgetRepository;
        this.budgetItemRepository = budgetItemRepository;
        this.casePartRepository = casePartRepository;
        this.franchiseRecoveryService = franchiseRecoveryService;
    }

    @Transactional(readOnly = true)
    public List<InsuranceCompanyResponse> listCompanies(String q, Boolean active) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        accessControlService.requirePermission(currentUser, "seguro.ver");
        return companyRepository.search(q == null ? "" : q.trim(), active == null ? true : active).stream().map(this::toCompanyResponse).toList();
    }

    @Transactional(readOnly = true)
    public InsuranceCompanyResponse getCompany(Long companyId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        accessControlService.requirePermission(currentUser, "seguro.ver");
        return toCompanyResponse(requireCompany(companyId));
    }

    @Transactional
    public InsuranceCompanyResponse createCompany(InsuranceCompanyCreateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        accessControlService.requirePermission(currentUser, "seguro.crear");
        String code = blankToNull(request.code());
        if (code != null && companyRepository.existsByCodeIgnoreCase(code)) throw new ConflictException("Ya existe la compania con codigo " + request.code());
        InsuranceCompanyEntity entity = new InsuranceCompanyEntity();
        entity.setCode(code == null ? "AUTO-" + java.util.UUID.randomUUID() : code.toUpperCase());
        entity.setName(request.name().trim());
        entity.setTaxId(blankToNull(request.taxId()));
        entity.setRequiresRepairPhotos(Boolean.TRUE.equals(request.requiresRepairPhotos()));
        entity.setExpectedPaymentDays(request.expectedPaymentDays());
        entity.setActive(request.active() == null || request.active());
        entity = companyRepository.save(entity);
        caseAuditService.register(currentUser.id(), null, "companias_seguro", entity.getId(), "crear_compania_seguro", null, caseAuditService.toJson(Map.of("companyCode", entity.getCode())), caseAuditService.toJson(Map.of("domain", "seguros")), httpRequest);
        return toCompanyResponse(entity);
    }

    @Transactional
    public InsuranceCompanyResponse updateCompany(Long companyId, InsuranceCompanyUpdateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        accessControlService.requirePermission(currentUser, "seguro.crear");
        InsuranceCompanyEntity entity = requireCompany(companyId);
        String code = normalizeCode(request.code());
        if (!entity.getCode().equalsIgnoreCase(code) && companyRepository.existsByCodeIgnoreCase(code)) throw new ConflictException("Ya existe la compania con codigo " + code);
        entity.setCode(code); entity.setName(request.name().trim()); entity.setTaxId(blankToNull(request.taxId()));
        entity.setRequiresRepairPhotos(Boolean.TRUE.equals(request.requiresRepairPhotos())); entity.setExpectedPaymentDays(request.expectedPaymentDays());
        entity = companyRepository.save(entity);
        caseAuditService.register(currentUser.id(), null, "companias_seguro", entity.getId(), "actualizar_compania_seguro", null, caseAuditService.toJson(Map.of("companyCode", entity.getCode())), caseAuditService.toJson(Map.of("domain", "seguros")), httpRequest);
        return toCompanyResponse(entity);
    }

    @Transactional
    public InsuranceCompanyResponse deactivateCompany(Long companyId, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        accessControlService.requirePermission(currentUser, "seguro.crear");
        InsuranceCompanyEntity entity = requireCompany(companyId); entity.setActive(false);
        caseAuditService.register(currentUser.id(), null, "companias_seguro", entity.getId(), "desactivar_compania_seguro", null, caseAuditService.toJson(Map.of("companyCode", entity.getCode())), caseAuditService.toJson(Map.of("domain", "seguros")), httpRequest);
        return toCompanyResponse(entity);
    }

    @Transactional(readOnly = true)
    public List<InsuranceCompanyContactResponse> listCompanyContacts(Long companyId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        accessControlService.requirePermission(currentUser, "seguro.ver");
        requireCompany(companyId);
        return companyContactRepository.findByCompanyIdOrderByIdAsc(companyId).stream().map(this::toCompanyContactResponse).toList();
    }

    @Transactional
    public InsuranceCompanyContactResponse createCompanyContact(Long companyId, InsuranceCompanyContactCreateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        accessControlService.requirePermission(currentUser, "seguro.crear");
        requireCompany(companyId);
        if (!personRepository.existsById(request.personId())) throw new ResourceNotFoundException("No existe la persona " + request.personId());
        String contactRoleCode = normalizeCode(request.contactRoleCode());
        if (!roleContactRepository.existsByCodeAndActiveTrue(contactRoleCode)) throw new ConflictException("contactRoleCode no permitido: " + request.contactRoleCode());
        if (companyContactRepository.existsByCompanyIdAndPersonIdAndContactRoleCode(companyId, request.personId(), contactRoleCode)) throw new ConflictException("El contacto ya existe para esa compania");
        InsuranceCompanyContactEntity entity = new InsuranceCompanyContactEntity();
        entity.setCompanyId(companyId);
        entity.setPersonId(request.personId());
        entity.setContactRoleCode(contactRoleCode);
        entity = companyContactRepository.save(entity);
        caseAuditService.register(currentUser.id(), null, "companias_contactos", entity.getId(), "crear_contacto_compania", null, caseAuditService.toJson(Map.of("companyId", companyId, "personId", request.personId())), caseAuditService.toJson(Map.of("domain", "seguros")), httpRequest);
        return toCompanyContactResponse(entity);
    }

    @Transactional
    public void deleteCompanyContact(Long companyId, Long contactId, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        accessControlService.requirePermission(currentUser, "seguro.crear");
        requireCompany(companyId);
        InsuranceCompanyContactEntity entity = companyContactRepository.findById(contactId).orElseThrow(() -> new ResourceNotFoundException("No existe el contacto " + contactId));
        if (!entity.getCompanyId().equals(companyId)) throw new ConflictException("El contacto no pertenece a la compania indicada");
        companyContactRepository.delete(entity);
        caseAuditService.register(currentUser.id(), null, "companias_contactos", contactId, "eliminar_contacto_compania", caseAuditService.toJson(Map.of("companyId", companyId, "personId", entity.getPersonId())), null, caseAuditService.toJson(Map.of("domain", "seguros")), httpRequest);
    }

    @Transactional(readOnly = true)
    public CaseInsuranceResponse getCaseInsurance(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "seguro.ver");
        return caseInsuranceRepository.findByCaseId(caseId)
                .map(entity -> toCaseInsuranceResponse(entity, allowsCleasThirdParty(caseEntity))).orElse(null);
    }

    @Transactional
    public CaseInsuranceResponse upsertCaseInsurance(Long caseId, CaseInsuranceUpsertRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "seguro.crear");
        if (!allowsCleasThirdParty(caseEntity) && (request.thirdPartyCompanyId() != null || !isBlank(request.cleasNumber()))) {
            throw new ConflictException("Datos de CLEAS o tercero no aplican a casos GRANIZO");
        }
        requireCompany(request.insuranceCompanyId());
        if (request.thirdPartyCompanyId() != null) requireCompany(request.thirdPartyCompanyId());
        Long tramitadorCasePersonId = resolveCasePersonId(caseId, request.insuranceCompanyId(), request.processorPersonId(), "TRAMITADOR");
        Long inspectorCasePersonId = resolveCasePersonId(caseId, request.insuranceCompanyId(), request.inspectorPersonId(), "INSPECTOR");

        CaseInsuranceEntity entity = caseInsuranceRepository.findByCaseId(caseId).orElseGet(CaseInsuranceEntity::new);
        entity.setCaseId(caseId);
        entity.setInsuranceCompanyId(request.insuranceCompanyId());
        entity.setPolicyNumber(blankToNull(request.policyNumber()));
        entity.setCertificateNumber(blankToNull(request.certificateNumber()));
        entity.setCoverageDetail(blankToNull(request.coverageDetail()));
        entity.setThirdPartyCompanyId(request.thirdPartyCompanyId());
        entity.setCleasNumber(blankToNull(request.cleasNumber()));
        entity.setClaimNumber(blankToNull(request.claimNumber()));
        entity.setProcessorCasePersonId(tramitadorCasePersonId);
        entity.setInspectorCasePersonId(inspectorCasePersonId);
        entity = caseInsuranceRepository.save(entity);
        caseAuditService.register(currentUser.id(), caseId, "caso_seguro", entity.getId(), "upsert_caso_seguro", null, caseAuditService.toJson(Map.of("insuranceCompanyId", entity.getInsuranceCompanyId())), caseAuditService.toJson(Map.of("domain", "seguros")), httpRequest);
        return toCaseInsuranceResponse(entity, allowsCleasThirdParty(caseEntity));
    }

    @Transactional(readOnly = true)
    public InsuranceProcessingResponse getCaseInsuranceProcessing(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "seguro.ver");
        return insuranceProcessingRepository.findByCaseId(caseId)
                .map(this::toInsuranceProcessingResponse)
                .orElseGet(() -> toInsuranceProcessingProjection(caseId));
    }

    @Transactional
    public InsuranceProcessingResponse patchCaseInsuranceProcessing(Long caseId, InsuranceProcessingPatchRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCaseForUpdate(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "seguro.crear");
        InsuranceProcessingEntity entity = insuranceProcessingRepository.findByCaseId(caseId).orElseGet(InsuranceProcessingEntity::new);
        if (request.expectedVersion() != null && !request.expectedVersion().equals(entity.getVersion() == null ? 0L : entity.getVersion())) {
            throw new DomainConflictException("PROCESSING_VERSION_CONFLICT", "La tramitacion fue modificada por otro usuario", Map.of("expectedVersion", request.expectedVersion(), "actualVersion", entity.getVersion() == null ? 0L : entity.getVersion()));
        }
        entity.setCaseId(caseId);
        String previousPartsAuthorizationCode = entity.getPartsAuthorizationCode();
        applyPatch(entity, request);
        if (entity.getPresentedAt() == null && hasOperationalPatch(request)) {
            throw new DomainConflictException("PROCESSING_PRESENTATION_DATE_REQUIRED", "Debe registrar la fecha de presentacion antes de continuar la tramitacion", Map.of());
        }

        ProcessingDerivatives derivatives = processingDerivatives(caseId, entity.getAgreedAmount());
        if (request.has("partsAuthorizationCode") && !derivatives.includesParts()) {
            throw new DomainConflictException("PROCESSING_PARTS_AUTHORIZATION_REQUIRES_PARTS", "La autorizacion de repuestos requiere que el caso lleve repuestos", Map.of());
        }
        Map<String, Object> belowMinimumAudit = null;
        if (request.has("agreedAmount") && entity.getAgreedAmount() != null && derivatives.minimumCloseAmount() != null && entity.getAgreedAmount().compareTo(derivatives.minimumCloseAmount()) < 0) {
            BigDecimal difference = derivatives.minimumCloseAmount().subtract(entity.getAgreedAmount());
            Map<String, Object> amounts = CaseAuditService.auditMap("agreedAmount", entity.getAgreedAmount(), "minimumCloseAmount", derivatives.minimumCloseAmount(), "difference", difference);
            if (!Boolean.TRUE.equals(request.allowBelowMinimum())) {
                throw new DomainConflictException("PROCESSING_AMOUNT_BELOW_MINIMUM_CONFIRMATION_REQUIRED", "El monto acordado es inferior al minimo de cierre", amounts);
            }
            belowMinimumAudit = CaseAuditService.auditMap("agreedAmount", entity.getAgreedAmount(), "minimumCloseAmount", derivatives.minimumCloseAmount(), "difference", difference, "accepted", true);
        }
        entity = insuranceProcessingRepository.save(entity);
        Map<String, Object> auditSnapshot = CaseAuditService.auditMap("modalityCode", entity.getModalityCode(), "quotationStatusCode", entity.getQuotationStatusCode());
        Map<String, Object> auditBefore = null;
        if (request.has("partsAuthorizationCode")) {
            auditBefore = CaseAuditService.auditMap("partsAuthorizationCode", previousPartsAuthorizationCode);
            auditSnapshot.put("partsAuthorizationCode", entity.getPartsAuthorizationCode());
        }
        if (belowMinimumAudit != null) {
            auditSnapshot.putAll(belowMinimumAudit);
        }
        caseAuditService.register(currentUser.id(), caseId, "caso_tramitacion_seguro", entity.getId(), "patch_tramitacion_seguro", caseAuditService.toJson(auditBefore), caseAuditService.toJson(auditSnapshot), caseAuditService.toJson(Map.of("domain", "seguros")), httpRequest);
        return toInsuranceProcessingResponse(entity);
    }

    @Transactional(readOnly = true)
    public CaseFranchiseResponse getCaseFranchise(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "seguro.ver");
        return allowsFranchise(caseEntity) ? caseFranchiseRepository.findByCaseId(caseId).map(this::toCaseFranchiseResponse).orElse(null) : null;
    }

    @Transactional
    public CaseFranchiseResponse upsertCaseFranchise(Long caseId, CaseFranchiseUpsertRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCaseForUpdate(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "seguro.crear");
        requireFranchiseAllowed(caseEntity);
        validateFranchiseRequest(caseId, request);
        CaseFranchiseEntity entity = caseFranchiseRepository.findByCaseId(caseId).orElseGet(CaseFranchiseEntity::new);
        entity.setCaseId(caseId);
        entity.setFranchiseStatusCode(normalizedOptionalCode(request.franchiseStatusCode()));
        entity.setFranchiseAmount(scale(request.franchiseAmount()));
        entity.setRecoveryTypeCode(normalizedOptionalCode(request.recoveryTypeCode()));
        entity.setFranchiseOpinionCode(normalizedOptionalCode(request.franchiseOpinionCode()));
        entity.setExceedsFranchise(Boolean.TRUE.equals(request.exceedsFranchise()));
        entity.setRecoveryAmount(scale(request.recoveryAmount()));
        entity.setNotes(blankToNull(request.notes()));

        Long relatedCaseId = entity.getRelatedCaseId();
        if (relatedCaseId == null && "CIA_TERCERO".equals(normalizeCode(request.recoveryTypeCode()))) {
            relatedCaseId = franchiseRecoveryService.createRecoveryFromBaseCase(caseId, httpRequest);
        }
        entity.setRelatedCaseId(relatedCaseId);

        entity = caseFranchiseRepository.save(entity);
        caseAuditService.register(currentUser.id(), caseId, "caso_franquicia", entity.getId(), "upsert_franquicia", null, caseAuditService.toJson(CaseAuditService.auditMap("franchiseStatusCode", entity.getFranchiseStatusCode(), "recoveryAmount", entity.getRecoveryAmount())), caseAuditService.toJson(CaseAuditService.auditMap("domain", "seguros")), httpRequest);
        return toCaseFranchiseResponse(entity);
    }

    @Transactional(readOnly = true)
    public CaseCleasResponse getCaseCleas(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "seguro.ver");
        return allowsCleasThirdParty(caseEntity) ? caseCleasRepository.findByCaseId(caseId).map(this::toCaseCleasResponse).orElse(null) : null;
    }

    @Transactional
    public CaseCleasResponse upsertCaseCleas(Long caseId, CaseCleasUpsertRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "seguro.crear");
        requireCleasThirdPartyAllowed(caseEntity);
        validateCleasRequest(request);
        CaseCleasEntity entity = caseCleasRepository.findByCaseId(caseId).orElseGet(CaseCleasEntity::new);
        entity.setCaseId(caseId);
        entity.setScopeCode(normalizedOptionalCode(request.scopeCode()));
        entity.setOpinionCode(normalizedOptionalCode(request.opinionCode()));
        entity.setFranchiseAmount(scale(request.franchiseAmount()));
        entity.setCustomerChargeAmount(scale(request.customerChargeAmount()));
        entity.setCustomerPaymentStatusCode(normalizedOptionalCode(request.customerPaymentStatusCode()));
        entity.setCustomerPaymentDate(request.customerPaymentDate());
        entity.setCompanyFranchisePaymentAmount(scale(request.companyFranchisePaymentAmount()));
        entity.setCompanyFranchisePaymentStatusCode(normalizedOptionalCode(request.companyFranchisePaymentStatusCode()));
        entity.setCompanyFranchisePaymentDate(request.companyFranchisePaymentDate());
        entity = caseCleasRepository.save(entity);
        caseAuditService.register(currentUser.id(), caseId, "caso_cleas", entity.getId(), "upsert_caso_cleas", null, caseAuditService.toJson(Map.of("scopeCode", entity.getScopeCode(), "opinionCode", entity.getOpinionCode())), caseAuditService.toJson(Map.of("domain", "seguros")), httpRequest);
        return toCaseCleasResponse(entity);
    }

    @Transactional(readOnly = true)
    public CaseThirdPartyResponse getCaseThirdParty(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "seguro.ver");
        return allowsCleasThirdParty(caseEntity) ? caseThirdPartyRepository.findByCaseId(caseId).map(this::toCaseThirdPartyResponse).orElse(null) : null;
    }

    @Transactional
    public CaseThirdPartyResponse upsertCaseThirdParty(Long caseId, CaseThirdPartyUpsertRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "seguro.crear");
        requireCleasThirdPartyAllowed(caseEntity);
        validateThirdPartyRequest(request);
        CaseThirdPartyEntity entity = caseThirdPartyRepository.findByCaseId(caseId).orElseGet(CaseThirdPartyEntity::new);
        entity.setCaseId(caseId);
        entity.setThirdPartyCompanyId(request.thirdPartyCompanyId());
        entity.setClaimReference(blankToNull(request.claimReference()));
        entity.setDocumentationStatusCode(normalizedOptionalCode(request.documentationStatusCode()));
        entity.setDocumentationAccepted(Boolean.TRUE.equals(request.documentationAccepted()));
        entity.setPartsProvisionModeCode(normalizedOptionalCode(request.partsProvisionModeCode()));
        entity.setMinimumLaborAmount(scale(request.minimumLaborAmount()));
        entity.setMinimumPartsAmount(scale(request.minimumPartsAmount()));
        entity.setBestQuotationSubtotal(scale(request.bestQuotationSubtotal()));
        entity.setFinalPartsTotal(scale(request.finalPartsTotal()));
        entity.setAmountToBillCompany(scale(request.amountToBillCompany()));
        entity.setFinalAmountForWorkshop(scale(request.finalAmountForWorkshop()));
        entity = caseThirdPartyRepository.save(entity);
        caseAuditService.register(currentUser.id(), caseId, "caso_terceros", entity.getId(), "upsert_caso_terceros", null, caseAuditService.toJson(Map.of("thirdPartyCompanyId", entity.getThirdPartyCompanyId())), caseAuditService.toJson(Map.of("domain", "seguros")), httpRequest);
        return toCaseThirdPartyResponse(entity);
    }

    @Transactional(readOnly = true)
    public CaseLegalResponse getCaseLegal(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "seguro.ver");
        return caseLegalRepository.findByCaseId(caseId).map(this::toCaseLegalResponse).orElse(null);
    }

    @Transactional
    public CaseLegalResponse upsertCaseLegal(Long caseId, CaseLegalUpsertRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "seguro.crear");
        validateCaseLegalRequest(request);
        CaseLegalEntity entity = caseLegalRepository.findByCaseId(caseId).orElseGet(CaseLegalEntity::new);
        entity.setCaseId(caseId);
        entity.setProcessorCode(normalizedOptionalCode(request.processorCode()));
        entity.setClaimantCode(normalizedOptionalCode(request.claimantCode()));
        entity.setInstanceCode(normalizedOptionalCode(request.instanceCode()));
        entity.setEntryDate(request.entryDate());
        entity.setCuij(blankToNull(request.cuij()));
        entity.setCourt(blankToNull(request.court()));
        entity.setCaseNumber(blankToNull(request.caseNumber()));
        entity.setCounterpartLawyer(blankToNull(request.counterpartLawyer()));
        entity.setCounterpartPhone(blankToNull(request.counterpartPhone()));
        entity.setCounterpartEmail(blankToNull(request.counterpartEmail()));
        entity.setRepairsVehicle(Boolean.TRUE.equals(request.repairsVehicle()));
        entity.setClosedByCode(normalizedOptionalCode(request.closedByCode()));
        entity.setLegalCloseDate(request.legalCloseDate());
        entity.setTotalProceedsAmount(scale(request.totalProceedsAmount()));
        entity.setObservations(blankToNull(request.observations()));
        entity.setClosingNotes(blankToNull(request.closingNotes()));
        entity = caseLegalRepository.save(entity);
        caseAuditService.register(currentUser.id(), caseId, "caso_legal", entity.getId(), "upsert_caso_legal", null, caseAuditService.toJson(Map.of("processorCode", entity.getProcessorCode(), "claimantCode", entity.getClaimantCode())), caseAuditService.toJson(Map.of("domain", "seguros")), httpRequest);
        return toCaseLegalResponse(entity);
    }

    @Transactional(readOnly = true)
    public List<LegalNewsResponse> listCaseLegalNews(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "seguro.ver");
        CaseLegalEntity caseLegal = caseLegalRepository.findByCaseId(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe caso_legal para el caso " + caseId));
        return legalNewsRepository.findByCaseLegalIdOrderByNewsDateDesc(caseLegal.getId()).stream().map(this::toLegalNewsResponse).toList();
    }

    @Transactional
    public LegalNewsResponse createCaseLegalNews(Long caseId, LegalNewsCreateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "seguro.crear");
        CaseLegalEntity caseLegal = caseLegalRepository.findByCaseId(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe caso_legal para el caso " + caseId));
        LegalNewsEntity entity = new LegalNewsEntity();
        entity.setCaseLegalId(caseLegal.getId());
        entity.setNewsDate(request.newsDate());
        entity.setDetail(request.detail());
        entity.setNotifyCustomer(Boolean.TRUE.equals(request.notifyCustomer()));
        entity = legalNewsRepository.save(entity);
        caseAuditService.register(currentUser.id(), caseId, "legal_novedades", entity.getId(), "crear_legal_novedad", null, caseAuditService.toJson(Map.of("newsDate", entity.getNewsDate())), caseAuditService.toJson(Map.of("domain", "seguros")), httpRequest);
        return toLegalNewsResponse(entity);
    }

    @Transactional(readOnly = true)
    public List<LegalExpenseResponse> listCaseLegalExpenses(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "seguro.ver");
        CaseLegalEntity caseLegal = caseLegalRepository.findByCaseId(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe caso_legal para el caso " + caseId));
        return legalExpenseRepository.findByCaseLegalIdOrderByExpenseDateDesc(caseLegal.getId()).stream().map(this::toLegalExpenseResponse).toList();
    }

    @Transactional
    public LegalExpenseResponse createCaseLegalExpense(Long caseId, LegalExpenseCreateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "seguro.crear");
        CaseLegalEntity caseLegal = caseLegalRepository.findByCaseId(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe caso_legal para el caso " + caseId));
        if (request.paidByCode() != null && !legalExpensePayerRepository.existsByCodeAndActiveTrue(normalizeCode(request.paidByCode()))) throw new ConflictException("paidByCode no permitido: " + request.paidByCode());
        LegalExpenseEntity entity = new LegalExpenseEntity();
        entity.setCaseLegalId(caseLegal.getId());
        entity.setConcept(request.concept().trim());
        entity.setAmount(scale(request.amount()));
        entity.setExpenseDate(request.expenseDate());
        entity.setPaidByCode(normalizedOptionalCode(request.paidByCode()));
        entity.setFinancialMovementId(request.financialMovementId());
        entity = legalExpenseRepository.save(entity);
        caseAuditService.register(currentUser.id(), caseId, "legal_gastos", entity.getId(), "crear_legal_gasto", null, caseAuditService.toJson(Map.of("concept", entity.getConcept(), "amount", entity.getAmount())), caseAuditService.toJson(Map.of("domain", "seguros")), httpRequest);
        return toLegalExpenseResponse(entity);
    }

    private void validateCleasRequest(CaseCleasUpsertRequest request) {
        if (request.scopeCode() != null && !cleasScopeRepository.existsByCodeAndActiveTrue(normalizeCode(request.scopeCode()))) throw new ConflictException("scopeCode no permitido: " + request.scopeCode());
        if (request.opinionCode() != null && !cleasOpinionRepository.existsByCodeAndActiveTrue(normalizeCode(request.opinionCode()))) throw new ConflictException("opinionCode no permitido: " + request.opinionCode());
        if (request.customerPaymentStatusCode() != null && !paymentStatusRepository.existsByCodeAndActiveTrue(normalizeCode(request.customerPaymentStatusCode()))) throw new ConflictException("customerPaymentStatusCode no permitido: " + request.customerPaymentStatusCode());
        if (request.companyFranchisePaymentStatusCode() != null && !paymentStatusRepository.existsByCodeAndActiveTrue(normalizeCode(request.companyFranchisePaymentStatusCode()))) throw new ConflictException("companyFranchisePaymentStatusCode no permitido: " + request.companyFranchisePaymentStatusCode());
    }

    private void validateThirdPartyRequest(CaseThirdPartyUpsertRequest request) {
        if (request.thirdPartyCompanyId() != null && !companyRepository.existsById(request.thirdPartyCompanyId())) throw new ResourceNotFoundException("No existe la compania tercero " + request.thirdPartyCompanyId());
        if (request.documentationStatusCode() != null && !thirdPartyDocumentationStatusRepository.existsByCodeAndActiveTrue(normalizeCode(request.documentationStatusCode()))) throw new ConflictException("documentationStatusCode no permitido: " + request.documentationStatusCode());
        if (request.partsProvisionModeCode() != null && !partsProvisionModeRepository.existsByCodeAndActiveTrue(normalizeCode(request.partsProvisionModeCode()))) throw new ConflictException("partsProvisionModeCode no permitido: " + request.partsProvisionModeCode());
    }

    private void validateFranchiseRequest(Long caseId, CaseFranchiseUpsertRequest request) {
        if (request.franchiseStatusCode() != null && !franchiseStatusRepository.existsByCodeAndActiveTrue(normalizeCode(request.franchiseStatusCode()))) throw new ConflictException("franchiseStatusCode no permitido: " + request.franchiseStatusCode());
        if (request.recoveryTypeCode() != null && !franchiseRecoveryTypeRepository.existsByCodeAndActiveTrue(normalizeCode(request.recoveryTypeCode()))) throw new ConflictException("recoveryTypeCode no permitido: " + request.recoveryTypeCode());
        if (request.franchiseOpinionCode() != null && !franchiseOpinionRepository.existsByCodeAndActiveTrue(normalizeCode(request.franchiseOpinionCode()))) throw new ConflictException("franchiseOpinionCode no permitido: " + request.franchiseOpinionCode());
        if (request.relatedCaseId() != null && caseRepository.findById(request.relatedCaseId()).isEmpty()) throw new ResourceNotFoundException("No existe el caso asociado " + request.relatedCaseId());
        if (request.relatedCaseId() != null && request.relatedCaseId().equals(caseId)) throw new ConflictException("relatedCaseId no puede ser el mismo caso");
    }

    private Long resolveCasePersonId(Long caseId, Long companyId, Long personId, String roleCode) {
        if (personId == null) return null;
        var person = personRepository.findById(personId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe la persona " + personId));
        if (!Boolean.TRUE.equals(person.getActivo())
                || !companyContactRepository.existsByCompanyIdAndPersonIdAndContactRoleCode(companyId, personId, roleCode)) {
            throw new ConflictException("La persona seleccionada no es un contacto activo " + roleCode + " de la compania indicada");
        }
        CasePersonEntity entity = casePersonRepository.findByCaseIdAndPersonId(caseId, personId).orElse(null);
        if (entity != null) {
            entity.setCaseRoleCode(roleCode);
            return entity.getId();
        }
        CasePersonEntity link = new CasePersonEntity();
        link.setCaseId(caseId);
        link.setPersonId(personId);
        link.setCaseRoleCode(roleCode);
        link.setPrincipal(false);
        link = casePersonRepository.save(link);
        return link.getId();
    }

    private InsuranceCompanyEntity requireCompany(Long companyId) { return companyRepository.findById(companyId).orElseThrow(() -> new ResourceNotFoundException("No existe la compania " + companyId)); }
    private CaseEntity requireCase(Long caseId) { return caseRepository.findById(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId)); }
    private CaseEntity requireCaseForUpdate(Long caseId) { return caseRepository.findByIdForUpdate(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId)); }
    private boolean allowsFranchise(CaseEntity caseEntity) { return insuranceRepairCasePolicy.allowsFranchise(caseTypeCode(caseEntity)); }
    private boolean allowsCleasThirdParty(CaseEntity caseEntity) { return insuranceRepairCasePolicy.allowsCleasThirdParty(caseTypeCode(caseEntity)); }
    private void requireFranchiseAllowed(CaseEntity caseEntity) { if (!allowsFranchise(caseEntity)) throw new ConflictException("Franquicia no aplica a casos GRANIZO"); }
    private void requireCleasThirdPartyAllowed(CaseEntity caseEntity) { if (!allowsCleasThirdParty(caseEntity)) throw new ConflictException("CLEAS y terceros no aplican a casos GRANIZO"); }
    private String caseTypeCode(CaseEntity caseEntity) { return caseTypeRepository.findById(caseEntity.getCaseTypeId()).map(CaseTypeEntity::getCode).orElse(""); }
    private InsuranceCompanyResponse toCompanyResponse(InsuranceCompanyEntity e) { return new InsuranceCompanyResponse(e.getId(), e.getPublicId(), e.getCode(), e.getName(), e.getTaxId(), e.getRequiresRepairPhotos(), e.getExpectedPaymentDays(), e.getActive()); }
    private InsuranceCompanyContactResponse toCompanyContactResponse(InsuranceCompanyContactEntity e) {
        String personName = e.getPersonId() != null
                ? personRepository.findById(e.getPersonId()).map(p -> p.getNombreMostrar()).orElse(null)
                : null;
        return new InsuranceCompanyContactResponse(e.getId(), e.getCompanyId(), e.getPersonId(), e.getContactRoleCode(), personName);
    }
    private CaseInsuranceResponse toCaseInsuranceResponse(CaseInsuranceEntity e) { return toCaseInsuranceResponse(e, true); }
    private CaseInsuranceResponse toCaseInsuranceResponse(CaseInsuranceEntity e, boolean includeLegacyCleasThirdParty) {
        Long processorPersonId = resolvePersonIdFromCasePerson(e.getProcessorCasePersonId());
        Long inspectorPersonId = resolvePersonIdFromCasePerson(e.getInspectorCasePersonId());
        return new CaseInsuranceResponse(e.getId(), e.getCaseId(), e.getInsuranceCompanyId(), e.getPolicyNumber(), e.getCertificateNumber(), e.getCoverageDetail(), includeLegacyCleasThirdParty ? e.getThirdPartyCompanyId() : null, includeLegacyCleasThirdParty ? e.getCleasNumber() : null, e.getClaimNumber(), e.getProcessorCasePersonId(), e.getInspectorCasePersonId(), processorPersonId, inspectorPersonId);
    }

    private Long resolvePersonIdFromCasePerson(Long casePersonId) {
        if (casePersonId == null) return null;
        return casePersonRepository.findById(casePersonId).map(CasePersonEntity::getPersonId).orElse(null);
    }
    private InsuranceProcessingResponse toInsuranceProcessingResponse(InsuranceProcessingEntity e) {
        var facts = todoRiesgoStateFactsRepository.findById(e.getCaseId()).orElse(null);
        ProcessingDerivatives derivatives = processingDerivatives(e.getCaseId(), e.getAgreedAmount());
        return new InsuranceProcessingResponse(e.getId(), e.getCaseId(), e.getPresentedAt(), e.getInspectionForwardedAt(), e.getModalityCode(), e.getOpinionCode(), e.getQuotationStatusCode(), e.getQuotationDate(), e.getAgreedAmount(), facts == null ? null : facts.getAgreementDate(), facts == null ? null : facts.getPassedToPaymentsDate(), derivatives.minimumCloseAmount(), derivatives.includesParts(), derivatives.includesParts() ? e.getPartsAuthorizationCode() : null, e.getPartsSupplierText(), e.getProviderId(), derivatives.amountToBillCompany(), e.getFinalAmountForWorkshop(), e.getNoRepair(), e.getAdminOverrideAppointment(), e.getPassedToPaymentsAt(), e.getEstimatedPaymentDate(), null, e.getInspectionDate(), e.getVersion());
    }
    private InsuranceProcessingResponse toInsuranceProcessingProjection(Long caseId) {
        ProcessingDerivatives derivatives = processingDerivatives(caseId, null);
        return new InsuranceProcessingResponse(null, caseId, null, null, null, null, null, null, null, null, null, derivatives.minimumCloseAmount(), derivatives.includesParts(), null, null, null, derivatives.amountToBillCompany(), null, null, null, null, null, null, null, 0L);
    }
    private CaseFranchiseResponse toCaseFranchiseResponse(CaseFranchiseEntity e) { return new CaseFranchiseResponse(e.getId(), e.getCaseId(), e.getFranchiseStatusCode(), e.getFranchiseAmount(), e.getRecoveryTypeCode(), e.getRelatedCaseId(), e.getFranchiseOpinionCode(), e.getExceedsFranchise(), e.getRecoveryAmount(), e.getNotes()); }
    private CaseCleasResponse toCaseCleasResponse(CaseCleasEntity e) { return new CaseCleasResponse(e.getId(), e.getCaseId(), e.getScopeCode(), e.getOpinionCode(), e.getFranchiseAmount(), e.getCustomerChargeAmount(), e.getCustomerPaymentStatusCode(), e.getCustomerPaymentDate(), e.getCompanyFranchisePaymentAmount(), e.getCompanyFranchisePaymentStatusCode(), e.getCompanyFranchisePaymentDate()); }
    private CaseThirdPartyResponse toCaseThirdPartyResponse(CaseThirdPartyEntity e) { return new CaseThirdPartyResponse(e.getId(), e.getCaseId(), e.getThirdPartyCompanyId(), e.getClaimReference(), e.getDocumentationStatusCode(), e.getDocumentationAccepted(), e.getPartsProvisionModeCode(), e.getMinimumLaborAmount(), e.getMinimumPartsAmount(), e.getBestQuotationSubtotal(), e.getFinalPartsTotal(), e.getAmountToBillCompany(), e.getFinalAmountForWorkshop()); }
    private CaseLegalResponse toCaseLegalResponse(CaseLegalEntity e) { return new CaseLegalResponse(e.getId(), e.getCaseId(), e.getProcessorCode(), e.getClaimantCode(), e.getInstanceCode(), e.getEntryDate(), e.getCuij(), e.getCourt(), e.getCaseNumber(), e.getCounterpartLawyer(), e.getCounterpartPhone(), e.getCounterpartEmail(), e.getRepairsVehicle(), e.getClosedByCode(), e.getLegalCloseDate(), e.getTotalProceedsAmount(), e.getObservations(), e.getClosingNotes()); }
    private LegalNewsResponse toLegalNewsResponse(LegalNewsEntity e) { return new LegalNewsResponse(e.getId(), e.getCaseLegalId(), e.getNewsDate(), e.getDetail(), e.getNotifyCustomer(), e.getNotifiedAt()); }
    private LegalExpenseResponse toLegalExpenseResponse(LegalExpenseEntity e) { return new LegalExpenseResponse(e.getId(), e.getCaseLegalId(), e.getConcept(), e.getAmount(), e.getExpenseDate(), e.getPaidByCode(), e.getFinancialMovementId()); }
    private void validateCaseLegalRequest(CaseLegalUpsertRequest request) {
        if (request.processorCode() != null && !legalProcessorRepository.existsByCodeAndActiveTrue(normalizeCode(request.processorCode()))) throw new ConflictException("processorCode no permitido: " + request.processorCode());
        if (request.claimantCode() != null && !legalClaimantRepository.existsByCodeAndActiveTrue(normalizeCode(request.claimantCode()))) throw new ConflictException("claimantCode no permitido: " + request.claimantCode());
        if (request.instanceCode() != null && !legalInstanceRepository.existsByCodeAndActiveTrue(normalizeCode(request.instanceCode()))) throw new ConflictException("instanceCode no permitido: " + request.instanceCode());
        if (request.closedByCode() != null && !legalClosureReasonRepository.existsByCodeAndActiveTrue(normalizeCode(request.closedByCode()))) throw new ConflictException("closedByCode no permitido: " + request.closedByCode());
    }
    private String normalizeCode(String value) { return value == null || value.isBlank() ? null : value.trim().toUpperCase(); }
    private boolean isBlank(String value) { return value == null || value.isBlank(); }
    private String normalizedOptionalCode(String value) { return value == null || value.isBlank() ? null : normalizeCode(value); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private BigDecimal scale(BigDecimal value) { return value == null ? null : value.setScale(2, RoundingMode.HALF_UP); }

    private void applyPatch(InsuranceProcessingEntity entity, InsuranceProcessingPatchRequest request) {
        if (request.has("presentedAt")) entity.setPresentedAt(dateValue(request.presentedAt(), "presentedAt"));
        if (request.has("inspectionForwardedAt")) entity.setInspectionForwardedAt(dateValue(request.inspectionForwardedAt(), "inspectionForwardedAt"));
        if (request.has("inspectionDate")) entity.setInspectionDate(dateValue(request.inspectionDate(), "inspectionDate"));
        if (request.has("modalityCode")) entity.setModalityCode(codeValue(request.modalityCode(), "modalityCode", modalityRepository::existsByCodeAndActiveTrue));
        if (request.has("opinionCode")) entity.setOpinionCode(codeValue(request.opinionCode(), "opinionCode", opinionRepository::existsByCodeAndActiveTrue));
        if (request.has("quotationStatusCode")) entity.setQuotationStatusCode(codeValue(request.quotationStatusCode(), "quotationStatusCode", quotationStatusRepository::existsByCodeAndActiveTrue));
        if (request.has("quotationDate")) entity.setQuotationDate(dateValue(request.quotationDate(), "quotationDate"));
        if (request.has("agreedAmount")) entity.setAgreedAmount(decimalValue(request.agreedAmount(), "agreedAmount"));
        if (request.has("partsAuthorizationCode")) entity.setPartsAuthorizationCode(partsAuthorizationCodeValue(request.partsAuthorizationCode()));
        if (request.has("partsSupplierText")) entity.setPartsSupplierText(textValue(request.partsSupplierText()));
        if (request.has("providerId")) applyProvider(entity, longValue(request.providerId(), "providerId"));
        if (request.has("finalAmountForWorkshop")) entity.setFinalAmountForWorkshop(decimalValue(request.finalAmountForWorkshop(), "finalAmountForWorkshop"));
        if (request.has("passedToPaymentsAt")) entity.setPassedToPaymentsAt(dateValue(request.passedToPaymentsAt(), "passedToPaymentsAt"));
        if (request.has("estimatedPaymentDate")) entity.setEstimatedPaymentDate(dateValue(request.estimatedPaymentDate(), "estimatedPaymentDate"));
    }

    private boolean hasOperationalPatch(InsuranceProcessingPatchRequest request) {
        return request.has("inspectionForwardedAt") || request.has("inspectionDate") || request.has("modalityCode") || request.has("opinionCode")
                || request.has("quotationStatusCode") || request.has("quotationDate") || request.has("agreedAmount") || request.has("partsAuthorizationCode") || request.has("partsSupplierText")
                || request.has("providerId") || request.has("finalAmountForWorkshop") || request.has("passedToPaymentsAt") || request.has("estimatedPaymentDate");
    }

    private ProcessingDerivatives processingDerivatives(Long caseId, BigDecimal agreedAmount) {
        BudgetEntity budget = budgetRepository.findByCaseId(caseId).orElse(null);
        List<BudgetItemEntity> items = budget == null ? List.of() : budgetItemRepository.findByBudgetIdOrderByVisualOrderAsc(budget.getId());
        Set<Long> replacementItemIds = items.stream()
                .filter(item -> Boolean.TRUE.equals(item.getActive()) && (Boolean.TRUE.equals(item.getRequiresReplacement()) || "REEMPLAZAR".equals(normalizeCode(item.getPartDecisionCode()))))
                .map(BudgetItemEntity::getId)
                .collect(Collectors.toSet());
        boolean includesParts = !replacementItemIds.isEmpty();
        CaseFranchiseEntity franchise = caseFranchiseRepository.findByCaseId(caseId).orElse(null);
        BigDecimal amountToBill = null;
        if (agreedAmount != null) {
            amountToBill = franchise != null && "PROPIA_CIA".equals(normalizeCode(franchise.getRecoveryTypeCode()))
                    ? agreedAmount
                    : agreedAmount.subtract(franchise == null || franchise.getFranchiseAmount() == null ? BigDecimal.ZERO : scale(franchise.getFranchiseAmount())).max(BigDecimal.ZERO);
        }
        return new ProcessingDerivatives(budget == null ? null : scale(budget.getMinimumCloseAmount()), includesParts, amountToBill);
    }

    private void applyProvider(InsuranceProcessingEntity entity, Long providerId) {
        if (providerId == null) { entity.setProviderId(null); return; }
        var provider = providerRepository.findById(providerId).orElseThrow(() -> new ResourceNotFoundException("No existe el proveedor " + providerId));
        if (!Boolean.TRUE.equals(provider.getActive())) throw new ConflictException("El proveedor esta inactivo: " + providerId);
        entity.setProviderId(provider.getId());
        entity.setPartsSupplierText(provider.getName());
    }

    private LocalDate dateValue(JsonNode node, String field) { return node.isNull() ? null : LocalDate.parse(node.asText()); }
    private BigDecimal decimalValue(JsonNode node, String field) { if (node.isNull()) return null; if (!node.isNumber()) throw new ConflictException(field + " debe ser numerico"); return scale(node.decimalValue()); }
    private Long longValue(JsonNode node, String field) { if (node.isNull()) return null; if (!node.canConvertToLong()) throw new ConflictException(field + " debe ser un identificador valido"); return node.longValue(); }
    private String textValue(JsonNode node) { return node.isNull() ? null : blankToNull(node.asText()); }
    private String codeValue(JsonNode node, String field, java.util.function.Predicate<String> exists) { if (node.isNull()) return null; String code = normalizeCode(node.asText()); if (!exists.test(code)) throw new ConflictException(field + " no permitido: " + node.asText()); return code; }
    private String partsAuthorizationCodeValue(JsonNode node) {
        if (node.isNull()) return null;
        String code = normalizeCode(node.asText());
        if (!Set.of("TOTAL", "PARCIAL", "RECHAZADO").contains(code) || !partsAuthorizationRepository.existsByCodeAndActiveTrue(code)) {
            throw new ConflictException("partsAuthorizationCode no permitido: " + node.asText());
        }
        return code;
    }
    private record ProcessingDerivatives(BigDecimal minimumCloseAmount, boolean includesParts, BigDecimal amountToBillCompany) {}
}
