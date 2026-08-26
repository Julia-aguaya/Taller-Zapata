package com.tallerzapata.backend.application.extrabudget;

import com.tallerzapata.backend.api.extrabudget.ExtraBudgetComparisonRequest;
import com.tallerzapata.backend.api.extrabudget.ExtraBudgetComparisonResponse;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.extrabudget.*;
import com.tallerzapata.backend.infrastructure.persistence.provider.ProviderEntity;
import com.tallerzapata.backend.infrastructure.persistence.provider.ProviderRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;

@Service
public class ExtraBudgetComparisonService {
    private static final String EXTRA_BUDGET_ITEM = "EXTRA_BUDGET_ITEM";
    private final CaseRepository cases; private final CaseTypeRepository caseTypes; private final ExtraBudgetRepository budgets; private final ExtraBudgetVersionRepository versions; private final ExtraBudgetItemRepository items;
    private final ExtraBudgetComparisonPieceRepository pieces; private final ExtraBudgetComparisonQuoteRepository quotes;
    private final ProviderRepository providers; private final CurrentUserService users; private final CaseAccessControlService access;

    public ExtraBudgetComparisonService(CaseRepository cases, CaseTypeRepository caseTypes, ExtraBudgetRepository budgets, ExtraBudgetVersionRepository versions, ExtraBudgetItemRepository items,
                                        ExtraBudgetComparisonPieceRepository pieces, ExtraBudgetComparisonQuoteRepository quotes,
                                        ProviderRepository providers, CurrentUserService users, CaseAccessControlService access) {
        this.cases = cases; this.caseTypes = caseTypes; this.budgets = budgets; this.versions = versions; this.items = items; this.pieces = pieces; this.quotes = quotes;
        this.providers = providers; this.users = users; this.access = access;
    }

    @Transactional
    public ExtraBudgetComparisonResponse quote(Long caseId, ExtraBudgetComparisonRequest request) {
        require(caseId, "presupuesto.crear");
        ExtraBudgetItemEntity item = requireReplacementItem(caseId, request.itemId(), request.expectedVersion());
        if (request.providerId() == null || request.amount() == null || request.amount().signum() < 0) throw new ConflictException("La cotización requiere proveedor e importe no negativo");
        ProviderEntity provider = providers.findById(request.providerId()).orElseThrow(() -> new ResourceNotFoundException("No existe el proveedor " + request.providerId()));
        if (!Boolean.TRUE.equals(provider.getActive())) throw new ConflictException("El proveedor está inactivo");
        ExtraBudgetComparisonPieceEntity piece = piece(item);
        ExtraBudgetComparisonQuoteEntity quote = quotes.findByPieceIdAndProviderId(piece.getId(), provider.getId()).orElseGet(ExtraBudgetComparisonQuoteEntity::new);
        quote.setPieceId(piece.getId()); quote.setProviderId(provider.getId()); quote.setProviderName(provider.getName()); quote.setAmount(money(request.amount()));
        if (quote.getSelected() == null) quote.setSelected(false);
        quotes.save(quote);
        if (Boolean.TRUE.equals(quote.getSelected())) {
            item.setPartsAmount(quote.getAmount()); item.setSelectedQuoteAmount(quote.getAmount());
            item.setSelectedProviderId(quote.getProviderId()); item.setSelectedProviderName(quote.getProviderName()); items.save(item);
        }
        return response(item, piece);
    }

    @Transactional
    public ExtraBudgetComparisonResponse select(Long caseId, ExtraBudgetComparisonRequest request) {
        require(caseId, "presupuesto.crear");
        ExtraBudgetItemEntity item = requireReplacementItem(caseId, request.itemId(), request.expectedVersion());
        ExtraBudgetComparisonPieceEntity piece = piece(item);
        ExtraBudgetComparisonQuoteEntity selected = quotes.findByPieceIdAndProviderId(piece.getId(), request.providerId())
                .orElseThrow(() -> new ConflictException("Ingresá una cotización antes de seleccionarla"));
        for (ExtraBudgetComparisonQuoteEntity quote : quotes.findByPieceIdOrderByIdAsc(piece.getId())) quote.setSelected(quote.getId().equals(selected.getId()));
        item.setPartsAmount(selected.getAmount()); item.setSelectedProviderId(selected.getProviderId());
        item.setSelectedProviderName(selected.getProviderName()); item.setSelectedQuoteAmount(selected.getAmount()); items.save(item);
        return response(item, piece);
    }

    @Transactional(readOnly = true)
    public ExtraBudgetComparisonResponse detail(Long caseId, Long itemId) {
        require(caseId, "presupuesto.ver");
        ExtraBudgetItemEntity item = requireReplacementItem(caseId, itemId, null);
        ExtraBudgetComparisonPieceEntity piece = pieces.findByItemId(item.getId()).orElseThrow(() -> new ResourceNotFoundException("La pieza extra todavía no tiene comparación"));
        return response(item, piece);
    }

    private ExtraBudgetComparisonPieceEntity piece(ExtraBudgetItemEntity item) {
        return pieces.findByItemId(item.getId()).orElseGet(() -> {
            ExtraBudgetComparisonPieceEntity piece = new ExtraBudgetComparisonPieceEntity();
            piece.setItemId(item.getId()); piece.setDescription(item.getDescription()); return pieces.saveAndFlush(piece);
        });
    }
    private ExtraBudgetItemEntity requireReplacementItem(Long caseId, Long itemId, Long expectedVersion) {
        if (itemId == null) throw new ConflictException("Debe indicar el item extra a cotizar");
        ExtraBudgetItemEntity item = items.findById(itemId).orElseThrow(() -> new ResourceNotFoundException("No existe el item extra " + itemId));
        ExtraBudgetEntity header = budgets.findByCaseId(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe presupuesto extra para el caso " + caseId));
        if (expectedVersion != null && !expectedVersion.equals(header.getVersionLock())) throw new ConflictException("El presupuesto extra fue modificado por otra operación");
        ExtraBudgetVersionEntity version = versions.findById(item.getExtraBudgetVersionId()).orElseThrow(() -> new ResourceNotFoundException("No existe la versión del item extra"));
        if (!header.getId().equals(version.getExtraBudgetId())) throw new ResourceNotFoundException("El item extra no pertenece al caso");
        if (version.getStatus() != ExtraBudgetStatus.BORRADOR) throw new ConflictException("La comparación extra sólo puede modificarse antes de la presentación");
        if (!EXTRA_BUDGET_ITEM.equals(item.getSourceType()) || !"REEMPLAZAR".equals(item.getActionCode()) || !Boolean.TRUE.equals(item.getActive())) throw new ConflictException("Sólo los items EXTRA_BUDGET_ITEM REEMPLAZAR activos pueden cotizarse");
        return item;
    }
    private ExtraBudgetComparisonResponse response(ExtraBudgetItemEntity item, ExtraBudgetComparisonPieceEntity piece) {
        List<ExtraBudgetComparisonQuoteEntity> rows = quotes.findByPieceIdOrderByIdAsc(piece.getId());
        BigDecimal best = rows.stream().map(ExtraBudgetComparisonQuoteEntity::getAmount).min(Comparator.naturalOrder()).orElse(null);
        return new ExtraBudgetComparisonResponse(item.getId(), piece.getId(), piece.getDescription(), item.getSelectedQuoteAmount(), item.getSelectedProviderId(),
                rows.stream().map(q -> new ExtraBudgetComparisonResponse.Quote(q.getId(), q.getProviderId(), q.getProviderName(), q.getAmount(), Boolean.TRUE.equals(q.getSelected()), best != null && q.getAmount().compareTo(best) == 0)).toList());
    }
    private void require(Long caseId, String permission) {
        AuthenticatedUser user = users.requireCurrentUser(); CaseEntity caseEntity = cases.findById(caseId).orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
        access.requireCaseAccess(user, caseEntity, permission);
        String type = caseTypes.findById(caseEntity.getCaseTypeId()).map(CaseTypeEntity::getCode).orElse(null);
        if (!"TODO_RIESGO".equals(type) && !"GRANIZO".equals(type)) throw new ConflictException("La comparación extra sólo aplica a casos TODO_RIESGO o GRANIZO");
    }
    private BigDecimal money(BigDecimal value) { return value.setScale(2, RoundingMode.HALF_UP); }
}
