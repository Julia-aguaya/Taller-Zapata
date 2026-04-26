package com.tallerzapata.backend.application.finance;

import com.tallerzapata.backend.api.casefile.CodeCatalogResponse;
import com.tallerzapata.backend.api.finance.FinanceCatalogsResponse;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.finance.*;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinanceCatalogService {
    private final FinancialMovementTypeRepository movementTypeRepository;
    private final FinancialFlowOriginRepository flowOriginRepository;
    private final FinancialCounterpartyTypeRepository counterpartyTypeRepository;
    private final FinancialPaymentMethodRepository paymentMethodRepository;
    private final FinancialCancellationTypeRepository cancellationTypeRepository;
    private final FinancialRetentionTypeRepository retentionTypeRepository;
    private final FinancialApplicationConceptRepository applicationConceptRepository;
    private final IssuedReceiptTypeRepository issuedReceiptTypeRepository;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService accessControlService;

    public FinanceCatalogService(FinancialMovementTypeRepository movementTypeRepository, FinancialFlowOriginRepository flowOriginRepository, FinancialCounterpartyTypeRepository counterpartyTypeRepository, FinancialPaymentMethodRepository paymentMethodRepository, FinancialCancellationTypeRepository cancellationTypeRepository, FinancialRetentionTypeRepository retentionTypeRepository, FinancialApplicationConceptRepository applicationConceptRepository, IssuedReceiptTypeRepository issuedReceiptTypeRepository, CurrentUserService currentUserService, CaseAccessControlService accessControlService) {
        this.movementTypeRepository = movementTypeRepository;
        this.flowOriginRepository = flowOriginRepository;
        this.counterpartyTypeRepository = counterpartyTypeRepository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.cancellationTypeRepository = cancellationTypeRepository;
        this.retentionTypeRepository = retentionTypeRepository;
        this.applicationConceptRepository = applicationConceptRepository;
        this.issuedReceiptTypeRepository = issuedReceiptTypeRepository;
        this.currentUserService = currentUserService;
        this.accessControlService = accessControlService;
    }

    @Transactional(readOnly = true)
    public FinanceCatalogsResponse listCatalogs() {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        accessControlService.requirePermission(currentUser, "finanza.ver");
        return new FinanceCatalogsResponse(
                movementTypeRepository.findByActiveTrueOrderByNameAsc().stream().map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                flowOriginRepository.findByActiveTrueOrderByNameAsc().stream().map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                counterpartyTypeRepository.findByActiveTrueOrderByNameAsc().stream().map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                paymentMethodRepository.findByActiveTrueOrderByNameAsc().stream().map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                cancellationTypeRepository.findByActiveTrueOrderByNameAsc().stream().map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                retentionTypeRepository.findByActiveTrueOrderByNameAsc().stream().map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                applicationConceptRepository.findByActiveTrueOrderByNameAsc().stream().map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList(),
                issuedReceiptTypeRepository.findByActiveTrueOrderByNameAsc().stream().map(i -> new CodeCatalogResponse(i.getCode(), i.getName())).toList()
        );
    }
}
