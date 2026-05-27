package com.tallerzapata.backend.application.budget;

import com.tallerzapata.backend.api.budget.*;
import com.tallerzapata.backend.api.casefile.CodeCatalogResponse;
import com.tallerzapata.backend.application.casefile.CaseAuditService;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.budget.*;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
public class PartSupplierQuoteService {
    private final PartSupplierQuoteRepository quoteRepository;
    private final CasePartRepository casePartRepository;
    private final CaseRepository caseRepository;
    private final QuoteBillingRepository billingRepository;
    private final QuotePaymentMethodRepository paymentMethodRepository;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService accessControlService;
    private final CaseAuditService caseAuditService;

    public PartSupplierQuoteService(PartSupplierQuoteRepository quoteRepository, CasePartRepository casePartRepository, CaseRepository caseRepository, QuoteBillingRepository billingRepository, QuotePaymentMethodRepository paymentMethodRepository, CurrentUserService currentUserService, CaseAccessControlService accessControlService, CaseAuditService caseAuditService) {
        this.quoteRepository = quoteRepository;
        this.casePartRepository = casePartRepository;
        this.caseRepository = caseRepository;
        this.billingRepository = billingRepository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.currentUserService = currentUserService;
        this.accessControlService = accessControlService;
        this.caseAuditService = caseAuditService;
    }

    @Transactional(readOnly = true)
    public List<PartSupplierQuoteResponse> listQuotes(Long caseId, Long partId) {
        AuthenticatedUser user = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = caseRepository.findById(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
        accessControlService.requireCaseAccess(user, caseEntity, "presupuesto.ver");
        CasePartEntity part = casePartRepository.findById(partId).orElseThrow(() -> new ResourceNotFoundException("No existe el repuesto " + partId));
        if (!part.getCaseId().equals(caseId)) throw new ConflictException("El repuesto no pertenece al caso indicado");
        return quoteRepository.findByPartIdOrderByIdAsc(partId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public PartSupplierQuoteResponse createQuote(Long caseId, Long partId, PartSupplierQuoteCreateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser user = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = caseRepository.findById(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
        accessControlService.requireCaseAccess(user, caseEntity, "presupuesto.crear");
        CasePartEntity part = casePartRepository.findById(partId).orElseThrow(() -> new ResourceNotFoundException("No existe el repuesto " + partId));
        if (!part.getCaseId().equals(caseId)) throw new ConflictException("El repuesto no pertenece al caso indicado");
        if (!billingRepository.existsByCodeAndActiveTrue(normalizeCode(request.billingCode()))) throw new ConflictException("billingCode no permitido: " + request.billingCode());
        if (!paymentMethodRepository.existsByCodeAndActiveTrue(normalizeCode(request.paymentMethodCode()))) throw new ConflictException("paymentMethodCode no permitido: " + request.paymentMethodCode());

        PartSupplierQuoteEntity entity = new PartSupplierQuoteEntity();
        entity.setPartId(partId);
        entity.setSupplier(request.supplier().trim());
        entity.setAmount(request.amount());
        entity.setBillingCode(normalizeCode(request.billingCode()));
        entity.setPaymentMethodCode(normalizeCode(request.paymentMethodCode()));
        entity = quoteRepository.save(entity);
        caseAuditService.register(user.id(), caseId, "cotizaciones_repuesto", entity.getId(), "crear_cotizacion", null, caseAuditService.toJson(Map.of("supplier", entity.getSupplier(), "amount", entity.getAmount())), caseAuditService.toJson(Map.of("domain", "presupuestos")), httpRequest);
        return toResponse(entity);
    }

    @Transactional
    public void deleteQuote(Long caseId, Long partId, Long quoteId, HttpServletRequest httpRequest) {
        AuthenticatedUser user = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = caseRepository.findById(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
        accessControlService.requireCaseAccess(user, caseEntity, "presupuesto.crear");
        CasePartEntity part = casePartRepository.findById(partId).orElseThrow(() -> new ResourceNotFoundException("No existe el repuesto " + partId));
        if (!part.getCaseId().equals(caseId)) throw new ConflictException("El repuesto no pertenece al caso indicado");
        PartSupplierQuoteEntity quote = quoteRepository.findById(quoteId).orElseThrow(() -> new ResourceNotFoundException("No existe la cotizacion " + quoteId));
        if (!quote.getPartId().equals(partId)) throw new ConflictException("La cotizacion no pertenece al repuesto indicado");
        quoteRepository.delete(quote);
        caseAuditService.register(user.id(), caseId, "cotizaciones_repuesto", quoteId, "eliminar_cotizacion", null, caseAuditService.toJson(Map.of("supplier", quote.getSupplier(), "amount", quote.getAmount())), caseAuditService.toJson(Map.of("domain", "presupuestos")), httpRequest);
    }

    @Transactional(readOnly = true)
    public PartQuotesBestSubtotalResponse getBestSubtotal(Long caseId) {
        AuthenticatedUser user = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = caseRepository.findById(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
        accessControlService.requireCaseAccess(user, caseEntity, "presupuesto.ver");
        List<CasePartEntity> parts = casePartRepository.findByCaseIdOrderByIdAsc(caseId);
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CasePartEntity part : parts) {
            List<PartSupplierQuoteEntity> quotes = quoteRepository.findByPartIdOrderByIdAsc(part.getId());
            if (!quotes.isEmpty()) {
                BigDecimal bestAmount = quotes.stream().map(PartSupplierQuoteEntity::getAmount).min(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);
                subtotal = subtotal.add(bestAmount);
            }
        }
        return new PartQuotesBestSubtotalResponse(subtotal);
    }

    @Transactional(readOnly = true)
    public QuoteCatalogsResponse getCatalogs() {
        var billings = billingRepository.findAll().stream().filter(b -> Boolean.TRUE.equals(b.getActive())).map(b -> new CodeCatalogResponse(b.getCode(), b.getName())).toList();
        var payments = paymentMethodRepository.findAll().stream().filter(p -> Boolean.TRUE.equals(p.getActive())).map(p -> new CodeCatalogResponse(p.getCode(), p.getName())).toList();
        return new QuoteCatalogsResponse(billings, payments);
    }

    private PartSupplierQuoteResponse toResponse(PartSupplierQuoteEntity e) {
        return new PartSupplierQuoteResponse(e.getId(), e.getPartId(), e.getSupplier(), e.getAmount(), e.getBillingCode(), e.getPaymentMethodCode());
    }

    private String normalizeCode(String value) { return value == null || value.isBlank() ? null : value.trim().toUpperCase(); }
}
