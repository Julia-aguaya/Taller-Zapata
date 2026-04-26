package com.tallerzapata.backend.application.insurance;

import com.tallerzapata.backend.api.insurance.*;
import com.tallerzapata.backend.application.casefile.CaseAuditService;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CasePersonEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CasePersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.*;
import com.tallerzapata.backend.infrastructure.persistence.person.PersonRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

@Service
public class InsuranceService {
    private final InsuranceCompanyRepository companyRepository;
    private final InsuranceCompanyContactRepository companyContactRepository;
    private final InsuranceRoleContactRepository roleContactRepository;
    private final PersonRepository personRepository;
    private final CaseRepository caseRepository;
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

    public InsuranceService(InsuranceCompanyRepository companyRepository, InsuranceCompanyContactRepository companyContactRepository, InsuranceRoleContactRepository roleContactRepository, PersonRepository personRepository, CaseRepository caseRepository, CasePersonRepository casePersonRepository, CaseInsuranceRepository caseInsuranceRepository, InsuranceProcessingRepository insuranceProcessingRepository, CaseFranchiseRepository caseFranchiseRepository, InsuranceModalityRepository modalityRepository, InsuranceOpinionRepository opinionRepository, InsuranceQuotationStatusRepository quotationStatusRepository, InsurancePartsAuthorizationRepository partsAuthorizationRepository, FranchiseStatusRepository franchiseStatusRepository, FranchiseRecoveryTypeRepository franchiseRecoveryTypeRepository, FranchiseOpinionRepository franchiseOpinionRepository, CaseCleasRepository caseCleasRepository, CaseThirdPartyRepository caseThirdPartyRepository, CleasScopeRepository cleasScopeRepository, CleasOpinionRepository cleasOpinionRepository, PaymentStatusRepository paymentStatusRepository, ThirdPartyDocumentationStatusRepository thirdPartyDocumentationStatusRepository, PartsProvisionModeRepository partsProvisionModeRepository, CaseLegalRepository caseLegalRepository, LegalNewsRepository legalNewsRepository, LegalExpenseRepository legalExpenseRepository, LegalProcessorRepository legalProcessorRepository, LegalClaimantRepository legalClaimantRepository, LegalInstanceRepository legalInstanceRepository, LegalClosureReasonRepository legalClosureReasonRepository, LegalExpensePayerRepository legalExpensePayerRepository, CurrentUserService currentUserService, CaseAccessControlService accessControlService, CaseAuditService caseAuditService) {
        this.companyRepository = companyRepository;
        this.companyContactRepository = companyContactRepository;
        this.roleContactRepository = roleContactRepository;
        this.personRepository = personRepository;
        this.caseRepository = caseRepository;
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
    }

    @Transactional(readOnly = true)
    public List<InsuranceCompanyResponse> listCompanies() {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        accessControlService.requirePermission(currentUser, "seguro.ver");
        return companyRepository.findByActiveTrueOrderByNameAsc().stream().map(this::toCompanyResponse).toList();
    }

    @Transactional
    public InsuranceCompanyResponse createCompany(InsuranceCompanyCreateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        accessControlService.requirePermission(currentUser, "seguro.crear");
        if (companyRepository.existsByCodeIgnoreCase(request.code().trim())) throw new ConflictException("Ya existe la compania con codigo " + request.code());
        InsuranceCompanyEntity entity = new InsuranceCompanyEntity();
        entity.setCode(request.code().trim().toUpperCase());
        entity.setName(request.name().trim());
        entity.setTaxId(blankToNull(request.taxId()));
        entity.setRequiresRepairPhotos(Boolean.TRUE.equals(request.requiresRepairPhotos()));
        entity.setExpectedPaymentDays(request.expectedPaymentDays());
        entity.setActive(request.active() == null || request.active());
        entity = companyRepository.save(entity);
        caseAuditService.register(currentUser.id(), null, "companias_seguro", entity.getId(), "crear_compania_seguro", null, caseAuditService.toJson(Map.of("companyCode", entity.getCode())), caseAuditService.toJson(Map.of("domain", "seguros")), httpRequest);
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

    @Transactional(readOnly = true)
    public CaseInsuranceResponse getCaseInsurance(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "seguro.ver");
        return caseInsuranceRepository.findByCaseId(caseId).map(this::toCaseInsuranceResponse).orElse(null);
    }

    @Transactional
    public CaseInsuranceResponse upsertCaseInsurance(Long caseId, CaseInsuranceUpsertRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "seguro.crear");
        requireCompany(request.insuranceCompanyId());
        if (request.thirdPartyCompanyId() != null) requireCompany(request.thirdPartyCompanyId());
        validateCasePersonReference(caseId, request.processorCasePersonId(), "tramitador");
        validateCasePersonReference(caseId, request.inspectorCasePersonId(), "inspector");

        CaseInsuranceEntity entity = caseInsuranceRepository.findByCaseId(caseId).orElseGet(CaseInsuranceEntity::new);
        entity.setCaseId(caseId);
        entity.setInsuranceCompanyId(request.insuranceCompanyId());
        entity.setPolicyNumber(blankToNull(request.policyNumber()));
        entity.setCertificateNumber(blankToNull(request.certificateNumber()));
        entity.setCoverageDetail(blankToNull(request.coverageDetail()));
        entity.setThirdPartyCompanyId(request.thirdPartyCompanyId());
        entity.setCleasNumber(blankToNull(request.cleasNumber()));
        entity.setProcessorCasePersonId(request.processorCasePersonId());
        entity.setInspectorCasePersonId(request.inspectorCasePersonId());
        entity = caseInsuranceRepository.save(entity);
        caseAuditService.register(currentUser.id(), caseId, "caso_seguro", entity.getId(), "upsert_caso_seguro", null, caseAuditService.toJson(Map.of("insuranceCompanyId", entity.getInsuranceCompanyId())), caseAuditService.toJson(Map.of("domain", "seguros")), httpRequest);
        return toCaseInsuranceResponse(entity);
    }

    @Transactional(readOnly = true)
    public InsuranceProcessingResponse getCaseInsuranceProcessing(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "seguro.ver");
        return insuranceProcessingRepository.findByCaseId(caseId).map(this::toInsuranceProcessingResponse).orElse(null);
    }

    @Transactional
    public InsuranceProcessingResponse upsertCaseInsuranceProcessing(Long caseId, InsuranceProcessingUpsertRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "seguro.crear");
        validateInsuranceProcessingRequest(request);
        InsuranceProcessingEntity entity = insuranceProcessingRepository.findByCaseId(caseId).orElseGet(InsuranceProcessingEntity::new);
        entity.setCaseId(caseId);
        entity.setPresentedAt(request.presentedAt());
        entity.setInspectionForwardedAt(request.inspectionForwardedAt());
        entity.setModalityCode(normalizedOptionalCode(request.modalityCode()));
        entity.setOpinionCode(normalizedOptionalCode(request.opinionCode()));
        entity.setQuotationStatusCode(normalizedOptionalCode(request.quotationStatusCode()));
        entity.setQuotationDate(request.quotationDate());
        entity.setAgreedAmount(scale(request.agreedAmount()));
        entity.setMinimumCloseAmount(scale(request.minimumCloseAmount()));
        entity.setIncludesParts(Boolean.TRUE.equals(request.includesParts()));
        entity.setPartsAuthorizationCode(normalizedOptionalCode(request.partsAuthorizationCode()));
        entity.setPartsSupplierText(blankToNull(request.partsSupplierText()));
        entity.setAmountToBillCompany(scale(request.amountToBillCompany()));
        entity.setFinalAmountForWorkshop(scale(request.finalAmountForWorkshop()));
        entity.setNoRepair(Boolean.TRUE.equals(request.noRepair()));
        entity.setAdminOverrideAppointment(Boolean.TRUE.equals(request.adminOverrideAppointment()));
        entity = insuranceProcessingRepository.save(entity);
        caseAuditService.register(currentUser.id(), caseId, "caso_tramitacion_seguro", entity.getId(), "upsert_tramitacion_seguro", null, caseAuditService.toJson(Map.of("modalityCode", entity.getModalityCode(), "quotationStatusCode", entity.getQuotationStatusCode())), caseAuditService.toJson(Map.of("domain", "seguros")), httpRequest);
        return toInsuranceProcessingResponse(entity);
    }

    @Transactional(readOnly = true)
    public CaseFranchiseResponse getCaseFranchise(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "seguro.ver");
        return caseFranchiseRepository.findByCaseId(caseId).map(this::toCaseFranchiseResponse).orElse(null);
    }

    @Transactional
    public CaseFranchiseResponse upsertCaseFranchise(Long caseId, CaseFranchiseUpsertRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "seguro.crear");
        validateFranchiseRequest(caseId, request);
        CaseFranchiseEntity entity = caseFranchiseRepository.findByCaseId(caseId).orElseGet(CaseFranchiseEntity::new);
        entity.setCaseId(caseId);
        entity.setFranchiseStatusCode(normalizedOptionalCode(request.franchiseStatusCode()));
        entity.setFranchiseAmount(scale(request.franchiseAmount()));
        entity.setRecoveryTypeCode(normalizedOptionalCode(request.recoveryTypeCode()));
        entity.setRelatedCaseId(request.relatedCaseId());
        entity.setFranchiseOpinionCode(normalizedOptionalCode(request.franchiseOpinionCode()));
        entity.setExceedsFranchise(Boolean.TRUE.equals(request.exceedsFranchise()));
        entity.setRecoveryAmount(scale(request.recoveryAmount()));
        entity.setNotes(blankToNull(request.notes()));
        entity = caseFranchiseRepository.save(entity);
        caseAuditService.register(currentUser.id(), caseId, "caso_franquicia", entity.getId(), "upsert_franquicia", null, caseAuditService.toJson(Map.of("franchiseStatusCode", entity.getFranchiseStatusCode(), "recoveryAmount", entity.getRecoveryAmount())), caseAuditService.toJson(Map.of("domain", "seguros")), httpRequest);
        return toCaseFranchiseResponse(entity);
    }

    @Transactional(readOnly = true)
    public CaseCleasResponse getCaseCleas(Long caseId) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "seguro.ver");
        return caseCleasRepository.findByCaseId(caseId).map(this::toCaseCleasResponse).orElse(null);
    }

    @Transactional
    public CaseCleasResponse upsertCaseCleas(Long caseId, CaseCleasUpsertRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "seguro.crear");
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
        return caseThirdPartyRepository.findByCaseId(caseId).map(this::toCaseThirdPartyResponse).orElse(null);
    }

    @Transactional
    public CaseThirdPartyResponse upsertCaseThirdParty(Long caseId, CaseThirdPartyUpsertRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = requireCase(caseId);
        accessControlService.requireCaseAccess(currentUser, caseEntity, "seguro.crear");
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

    private void validateInsuranceProcessingRequest(InsuranceProcessingUpsertRequest request) {
        if (request.modalityCode() != null && !modalityRepository.existsByCodeAndActiveTrue(normalizeCode(request.modalityCode()))) throw new ConflictException("modalityCode no permitido: " + request.modalityCode());
        if (request.opinionCode() != null && !opinionRepository.existsByCodeAndActiveTrue(normalizeCode(request.opinionCode()))) throw new ConflictException("opinionCode no permitido: " + request.opinionCode());
        if (request.quotationStatusCode() != null && !quotationStatusRepository.existsByCodeAndActiveTrue(normalizeCode(request.quotationStatusCode()))) throw new ConflictException("quotationStatusCode no permitido: " + request.quotationStatusCode());
        if (request.partsAuthorizationCode() != null && !partsAuthorizationRepository.existsByCodeAndActiveTrue(normalizeCode(request.partsAuthorizationCode()))) throw new ConflictException("partsAuthorizationCode no permitido: " + request.partsAuthorizationCode());
    }

    private void validateFranchiseRequest(Long caseId, CaseFranchiseUpsertRequest request) {
        if (request.franchiseStatusCode() != null && !franchiseStatusRepository.existsByCodeAndActiveTrue(normalizeCode(request.franchiseStatusCode()))) throw new ConflictException("franchiseStatusCode no permitido: " + request.franchiseStatusCode());
        if (request.recoveryTypeCode() != null && !franchiseRecoveryTypeRepository.existsByCodeAndActiveTrue(normalizeCode(request.recoveryTypeCode()))) throw new ConflictException("recoveryTypeCode no permitido: " + request.recoveryTypeCode());
        if (request.franchiseOpinionCode() != null && !franchiseOpinionRepository.existsByCodeAndActiveTrue(normalizeCode(request.franchiseOpinionCode()))) throw new ConflictException("franchiseOpinionCode no permitido: " + request.franchiseOpinionCode());
        if (request.relatedCaseId() != null && caseRepository.findById(request.relatedCaseId()).isEmpty()) throw new ResourceNotFoundException("No existe el caso asociado " + request.relatedCaseId());
        if (request.relatedCaseId() != null && request.relatedCaseId().equals(caseId)) throw new ConflictException("relatedCaseId no puede ser el mismo caso");
    }

    private void validateCasePersonReference(Long caseId, Long casePersonId, String label) {
        if (casePersonId == null) return;
        CasePersonEntity entity = casePersonRepository.findById(casePersonId).orElseThrow(() -> new ResourceNotFoundException("No existe el caso_persona para " + label + " " + casePersonId));
        if (!entity.getCaseId().equals(caseId)) throw new ConflictException("El " + label + " no pertenece al caso indicado");
    }

    private InsuranceCompanyEntity requireCompany(Long companyId) { return companyRepository.findById(companyId).orElseThrow(() -> new ResourceNotFoundException("No existe la compania " + companyId)); }
    private CaseEntity requireCase(Long caseId) { return caseRepository.findById(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId)); }
    private InsuranceCompanyResponse toCompanyResponse(InsuranceCompanyEntity e) { return new InsuranceCompanyResponse(e.getId(), e.getPublicId(), e.getCode(), e.getName(), e.getTaxId(), e.getRequiresRepairPhotos(), e.getExpectedPaymentDays(), e.getActive()); }
    private InsuranceCompanyContactResponse toCompanyContactResponse(InsuranceCompanyContactEntity e) { return new InsuranceCompanyContactResponse(e.getId(), e.getCompanyId(), e.getPersonId(), e.getContactRoleCode()); }
    private CaseInsuranceResponse toCaseInsuranceResponse(CaseInsuranceEntity e) { return new CaseInsuranceResponse(e.getId(), e.getCaseId(), e.getInsuranceCompanyId(), e.getPolicyNumber(), e.getCertificateNumber(), e.getCoverageDetail(), e.getThirdPartyCompanyId(), e.getCleasNumber(), e.getProcessorCasePersonId(), e.getInspectorCasePersonId()); }
    private InsuranceProcessingResponse toInsuranceProcessingResponse(InsuranceProcessingEntity e) { return new InsuranceProcessingResponse(e.getId(), e.getCaseId(), e.getPresentedAt(), e.getInspectionForwardedAt(), e.getModalityCode(), e.getOpinionCode(), e.getQuotationStatusCode(), e.getQuotationDate(), e.getAgreedAmount(), e.getMinimumCloseAmount(), e.getIncludesParts(), e.getPartsAuthorizationCode(), e.getPartsSupplierText(), e.getAmountToBillCompany(), e.getFinalAmountForWorkshop(), e.getNoRepair(), e.getAdminOverrideAppointment()); }
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
    private String normalizedOptionalCode(String value) { return value == null || value.isBlank() ? null : normalizeCode(value); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private BigDecimal scale(BigDecimal value) { return value == null ? null : value.setScale(2, RoundingMode.HALF_UP); }
}
