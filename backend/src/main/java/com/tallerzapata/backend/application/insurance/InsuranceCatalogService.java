package com.tallerzapata.backend.application.insurance;

import com.tallerzapata.backend.api.casefile.CodeCatalogResponse;
import com.tallerzapata.backend.api.insurance.InsuranceCatalogsResponse;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.insurance.*;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InsuranceCatalogService {
    private final InsuranceRoleContactRepository roleContactRepository;
    private final InsuranceModalityRepository modalityRepository;
    private final InsuranceOpinionRepository opinionRepository;
    private final InsuranceQuotationStatusRepository quotationStatusRepository;
    private final InsurancePartsAuthorizationRepository partsAuthorizationRepository;
    private final FranchiseStatusRepository franchiseStatusRepository;
    private final FranchiseRecoveryTypeRepository franchiseRecoveryTypeRepository;
    private final FranchiseOpinionRepository franchiseOpinionRepository;
    private final CleasScopeRepository cleasScopeRepository;
    private final CleasOpinionRepository cleasOpinionRepository;
    private final PaymentStatusRepository paymentStatusRepository;
    private final ThirdPartyDocumentationStatusRepository thirdPartyDocumentationStatusRepository;
    private final PartsProvisionModeRepository partsProvisionModeRepository;
    private final LegalProcessorRepository legalProcessorRepository;
    private final LegalClaimantRepository legalClaimantRepository;
    private final LegalInstanceRepository legalInstanceRepository;
    private final LegalClosureReasonRepository legalClosureReasonRepository;
    private final LegalExpensePayerRepository legalExpensePayerRepository;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService accessControlService;

    public InsuranceCatalogService(InsuranceRoleContactRepository roleContactRepository, InsuranceModalityRepository modalityRepository, InsuranceOpinionRepository opinionRepository, InsuranceQuotationStatusRepository quotationStatusRepository, InsurancePartsAuthorizationRepository partsAuthorizationRepository, FranchiseStatusRepository franchiseStatusRepository, FranchiseRecoveryTypeRepository franchiseRecoveryTypeRepository, FranchiseOpinionRepository franchiseOpinionRepository, CleasScopeRepository cleasScopeRepository, CleasOpinionRepository cleasOpinionRepository, PaymentStatusRepository paymentStatusRepository, ThirdPartyDocumentationStatusRepository thirdPartyDocumentationStatusRepository, PartsProvisionModeRepository partsProvisionModeRepository, LegalProcessorRepository legalProcessorRepository, LegalClaimantRepository legalClaimantRepository, LegalInstanceRepository legalInstanceRepository, LegalClosureReasonRepository legalClosureReasonRepository, LegalExpensePayerRepository legalExpensePayerRepository, CurrentUserService currentUserService, CaseAccessControlService accessControlService) {
        this.roleContactRepository = roleContactRepository;
        this.modalityRepository = modalityRepository;
        this.opinionRepository = opinionRepository;
        this.quotationStatusRepository = quotationStatusRepository;
        this.partsAuthorizationRepository = partsAuthorizationRepository;
        this.franchiseStatusRepository = franchiseStatusRepository;
        this.franchiseRecoveryTypeRepository = franchiseRecoveryTypeRepository;
        this.franchiseOpinionRepository = franchiseOpinionRepository;
        this.cleasScopeRepository = cleasScopeRepository;
        this.cleasOpinionRepository = cleasOpinionRepository;
        this.paymentStatusRepository = paymentStatusRepository;
        this.thirdPartyDocumentationStatusRepository = thirdPartyDocumentationStatusRepository;
        this.partsProvisionModeRepository = partsProvisionModeRepository;
        this.legalProcessorRepository = legalProcessorRepository;
        this.legalClaimantRepository = legalClaimantRepository;
        this.legalInstanceRepository = legalInstanceRepository;
        this.legalClosureReasonRepository = legalClosureReasonRepository;
        this.legalExpensePayerRepository = legalExpensePayerRepository;
        this.currentUserService = currentUserService;
        this.accessControlService = accessControlService;
    }

    @Transactional(readOnly = true)
    public InsuranceCatalogsResponse listCatalogs() {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        accessControlService.requirePermission(currentUser, "seguro.ver");
        return new InsuranceCatalogsResponse(
                roleContactRepository.findAll().stream().filter(i -> Boolean.TRUE.equals(i.getActive())).map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                modalityRepository.findAll().stream().filter(i -> Boolean.TRUE.equals(i.getActive())).map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                opinionRepository.findAll().stream().filter(i -> Boolean.TRUE.equals(i.getActive())).map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                quotationStatusRepository.findAll().stream().filter(i -> Boolean.TRUE.equals(i.getActive())).map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                partsAuthorizationRepository.findAll().stream().filter(i -> Boolean.TRUE.equals(i.getActive())).map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                franchiseStatusRepository.findAll().stream().filter(i -> Boolean.TRUE.equals(i.getActive())).map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                franchiseRecoveryTypeRepository.findAll().stream().filter(i -> Boolean.TRUE.equals(i.getActive())).map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                franchiseOpinionRepository.findAll().stream().filter(i -> Boolean.TRUE.equals(i.getActive())).map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                cleasScopeRepository.findAll().stream().filter(i -> Boolean.TRUE.equals(i.getActive())).map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                cleasOpinionRepository.findAll().stream().filter(i -> Boolean.TRUE.equals(i.getActive())).map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                paymentStatusRepository.findAll().stream().filter(i -> Boolean.TRUE.equals(i.getActive())).map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                thirdPartyDocumentationStatusRepository.findAll().stream().filter(i -> Boolean.TRUE.equals(i.getActive())).map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                partsProvisionModeRepository.findAll().stream().filter(i -> Boolean.TRUE.equals(i.getActive())).map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                legalProcessorRepository.findAll().stream().filter(i -> Boolean.TRUE.equals(i.getActive())).map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                legalClaimantRepository.findAll().stream().filter(i -> Boolean.TRUE.equals(i.getActive())).map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                legalInstanceRepository.findAll().stream().filter(i -> Boolean.TRUE.equals(i.getActive())).map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                legalClosureReasonRepository.findAll().stream().filter(i -> Boolean.TRUE.equals(i.getActive())).map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                legalExpensePayerRepository.findAll().stream().filter(i -> Boolean.TRUE.equals(i.getActive())).map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList()
        );
    }
}
