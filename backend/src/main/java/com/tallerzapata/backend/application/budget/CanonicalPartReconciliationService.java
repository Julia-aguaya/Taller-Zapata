package com.tallerzapata.backend.application.budget;

import com.tallerzapata.backend.application.casefile.CaseAuditService;
import com.tallerzapata.backend.infrastructure.persistence.budget.*;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class CanonicalPartReconciliationService {
    private final CaseRepository cases;
    private final CaseTypeRepository caseTypes;
    private final BudgetRepository budgets;
    private final BudgetItemRepository items;
    private final BudgetAccessoryWorkRepository accessoryWorks;
    private final CasePartRepository parts;
    private final PartSupplierQuoteRepository quotes;
    private final CasePartReconciliationWarningRepository warnings;
    private final CaseAuditService audit;

    public CanonicalPartReconciliationService(CaseRepository cases, CaseTypeRepository caseTypes, BudgetRepository budgets, BudgetItemRepository items, BudgetAccessoryWorkRepository accessoryWorks, CasePartRepository parts, PartSupplierQuoteRepository quotes, CasePartReconciliationWarningRepository warnings, CaseAuditService audit) {
        this.cases = cases; this.caseTypes = caseTypes; this.budgets = budgets; this.items = items; this.accessoryWorks = accessoryWorks; this.parts = parts; this.quotes = quotes; this.warnings = warnings; this.audit = audit;
    }

    @Transactional
    public List<CasePartEntity> reconcile(Long caseId, AuthenticatedUser user, HttpServletRequest request) {
        CaseEntity caseEntity = cases.findByIdForUpdate(caseId).orElseThrow();
        if (!caseTypes.findById(caseEntity.getCaseTypeId()).map(type -> "TODO_RIESGO".equals(type.getCode())).orElse(false)) return List.of();
        var budget = budgets.findByCaseId(caseId).orElse(null);
        if (budget == null) return List.of();

        Set<Long> activeItems = new HashSet<>();
        List<CasePartEntity> changed = new ArrayList<>();
        for (BudgetItemEntity item : items.findByBudgetIdOrderByVisualOrderAsc(budget.getId())) {
            if (!Boolean.TRUE.equals(item.getActive()) || !"REEMPLAZAR".equals(item.getActionCode())) continue;
            activeItems.add(item.getId());
            Optional<CasePartEntity> existing = parts.findByCaseIdAndBudgetItemIdAndSourceTypeAndNonCanonicalFalse(caseId, item.getId(), CasePartSourceType.BUDGET_ITEM);
            if (existing.isEmpty() && parts.existsByCaseIdAndBudgetItemId(caseId, item.getId())) continue;
            CasePartEntity part = existing.orElseGet(() -> newBudgetPart(caseId, item));
            boolean created = part.getId() == null;
            refreshBudgetPart(part, item);
            parts.save(part);
            changed.add(part);
            audit.register(user.id(), caseId, "repuestos_caso", part.getId(), created ? "crear_repuesto_canonico" : "actualizar_repuesto_canonico", null, null, audit.toJson(Map.of("sourceType", "BUDGET_ITEM", "sourceId", item.getId())), request);
        }

        Set<Long> activeAccessoryWorks = new HashSet<>();
        for (BudgetAccessoryWorkEntity work : accessoryWorks.findByBudgetIdOrderByIdAsc(budget.getId())) {
            if (!Boolean.TRUE.equals(work.getActive()) || !"REEMPLAZAR".equals(work.getActionCode())) continue;
            activeAccessoryWorks.add(work.getId());
            Optional<CasePartEntity> existing = parts.findByCaseIdAndAccessoryWorkIdAndSourceTypeAndNonCanonicalFalse(caseId, work.getId(), CasePartSourceType.ACCESSORY_WORK);
            if (existing.isEmpty() && parts.findByCaseIdAndAccessoryWorkId(caseId, work.getId()).isPresent()) continue;
            CasePartEntity part = existing.orElseGet(() -> newAccessoryPart(caseId, work));
            boolean created = part.getId() == null;
            part.setDescription(work.getAffectedPiece() == null ? "Trabajo extra" : work.getAffectedPiece());
            part.setBudgetedPrice(work.getReplacementAmount());
            if (part.getProviderAssignmentOrigin() != ProviderAssignmentOrigin.MANUAL) part.setFinalPrice(work.getReplacementAmount());
            parts.save(part);
            changed.add(part);
            audit.register(user.id(), caseId, "repuestos_caso", part.getId(), created ? "crear_repuesto_canonico" : "actualizar_repuesto_canonico", null, null, audit.toJson(Map.of("sourceType", "ACCESSORY_WORK", "sourceId", work.getId())), request);
        }

        for (CasePartEntity part : parts.findByCaseIdOrderByIdAsc(caseId)) {
            if (Boolean.TRUE.equals(part.getNonCanonical())) continue;
            boolean staleBudget = part.getSourceType() == CasePartSourceType.BUDGET_ITEM && !activeItems.contains(part.getBudgetItemId());
            boolean staleAccessory = part.getSourceType() == CasePartSourceType.ACCESSORY_WORK && !activeAccessoryWorks.contains(part.getAccessoryWorkId());
            if (!staleBudget && !staleAccessory) continue;
            if (hasActivity(part)) {
                createWarning(part, staleBudget ? CasePartSourceType.BUDGET_ITEM : CasePartSourceType.ACCESSORY_WORK, staleBudget ? part.getBudgetItemId() : part.getAccessoryWorkId());
                continue;
            }
            parts.delete(part);
            audit.register(user.id(), caseId, "repuestos_caso", part.getId(), "eliminar_repuesto_canonico_inactivo", null, null, audit.toJson(Map.of("sourceType", part.getSourceType().name())), request);
        }
        return changed;
    }

    private CasePartEntity newBudgetPart(Long caseId, BudgetItemEntity item) {
        CasePartEntity part = basePart(caseId, item.getAffectedPiece(), item.getPartValue());
        part.setBudgetItemId(item.getId()); part.setSourceType(CasePartSourceType.BUDGET_ITEM); part.setProviderAssignmentOrigin(ProviderAssignmentOrigin.BUDGET_ITEM); return part;
    }
    private CasePartEntity newAccessoryPart(Long caseId, BudgetAccessoryWorkEntity work) {
        CasePartEntity part = basePart(caseId, work.getAffectedPiece(), work.getReplacementAmount());
        part.setAccessoryWorkId(work.getId()); part.setSourceType(CasePartSourceType.ACCESSORY_WORK); part.setAccessory(true); return part;
    }
    private CasePartEntity basePart(Long caseId, String description, BigDecimal amount) {
        CasePartEntity part = new CasePartEntity(); part.setCaseId(caseId); part.setDescription(description == null ? "Repuesto sin descripción" : description); part.setStatusCode("PENDIENTE"); part.setBudgetedPrice(amount); part.setFinalPrice(amount); part.setUsed(false); part.setReturned(false); part.setNonCanonical(false); part.setAccessory(false); return part;
    }
    private void refreshBudgetPart(CasePartEntity part, BudgetItemEntity item) {
        part.setDescription(item.getAffectedPiece() == null ? "Repuesto sin descripción" : item.getAffectedPiece()); part.setBudgetedPrice(item.getPartValue()); part.setAccessory(false); part.setNonCanonical(false); part.setSourceType(CasePartSourceType.BUDGET_ITEM);
        if (part.getProviderAssignmentOrigin() != ProviderAssignmentOrigin.MANUAL) { part.setFinalPrice(item.getPartValue()); part.setProviderId(item.getProviderId()); part.setFinalSupplier(item.getProviderSnapshot()); part.setProviderAssignmentOrigin(ProviderAssignmentOrigin.BUDGET_ITEM); }
    }
    private boolean hasActivity(CasePartEntity part) {
        return part.getAuthorizedCode() != null || !"PENDIENTE".equals(part.getStatusCode()) || part.getPurchasedByCode() != null || part.getPaymentStatusCode() != null || part.getReceivedDate() != null || Boolean.TRUE.equals(part.getUsed()) || Boolean.TRUE.equals(part.getReturned()) || part.getInventoryNumber() != null || part.getPartCode() != null || part.getProviderAssignmentOrigin() == ProviderAssignmentOrigin.MANUAL || !quotes.findByPartIdOrderByIdAsc(part.getId()).isEmpty();
    }
    private void createWarning(CasePartEntity part, CasePartSourceType sourceType, Long sourceId) {
        if (warnings.existsByPartIdAndSourceTypeAndSourceIdAndState(part.getId(), sourceType, sourceId, "OPEN")) return;
        CasePartReconciliationWarningEntity warning = new CasePartReconciliationWarningEntity(); warning.setCaseId(part.getCaseId()); warning.setPartId(part.getId()); warning.setSourceType(sourceType); warning.setSourceId(sourceId); warning.setReason("La fuente canónica fue removida o dejó de ser REEMPLAZAR y el repuesto tiene actividad"); warning.setState("OPEN"); warnings.save(warning);
    }
}
