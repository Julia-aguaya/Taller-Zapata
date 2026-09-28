package com.tallerzapata.backend.application.insurance;

import com.tallerzapata.backend.api.insurance.ThirdPartyWorkshopRetentionPlanResponse;
import com.tallerzapata.backend.api.insurance.ThirdPartyWorkshopRetentionRequest;
import com.tallerzapata.backend.application.casefile.CaseAuditService;
import com.tallerzapata.backend.application.casefile.InsuranceRepairCasePolicy;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.finance.FinancialRetentionTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.ThirdPartyWorkshopRetentionEntity;
import com.tallerzapata.backend.infrastructure.persistence.insurance.ThirdPartyWorkshopRetentionPlanEntity;
import com.tallerzapata.backend.infrastructure.persistence.insurance.ThirdPartyWorkshopRetentionPlanRepository;
import com.tallerzapata.backend.infrastructure.persistence.insurance.ThirdPartyWorkshopRetentionRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class ThirdPartyWorkshopRetentionService {
    private final CaseRepository caseRepository;
    private final CaseTypeRepository caseTypeRepository;
    private final ThirdPartyWorkshopRetentionPlanRepository planRepository;
    private final ThirdPartyWorkshopRetentionRepository retentionRepository;
    private final FinancialRetentionTypeRepository retentionTypeRepository;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService accessControlService;
    private final CaseAuditService caseAuditService;
    private final InsuranceRepairCasePolicy insuranceRepairCasePolicy = new InsuranceRepairCasePolicy();

    public ThirdPartyWorkshopRetentionService(CaseRepository caseRepository, CaseTypeRepository caseTypeRepository, ThirdPartyWorkshopRetentionPlanRepository planRepository, ThirdPartyWorkshopRetentionRepository retentionRepository, FinancialRetentionTypeRepository retentionTypeRepository, CurrentUserService currentUserService, CaseAccessControlService accessControlService, CaseAuditService caseAuditService) {
        this.caseRepository = caseRepository;
        this.caseTypeRepository = caseTypeRepository;
        this.planRepository = planRepository;
        this.retentionRepository = retentionRepository;
        this.retentionTypeRepository = retentionTypeRepository;
        this.currentUserService = currentUserService;
        this.accessControlService = accessControlService;
        this.caseAuditService = caseAuditService;
    }

    @Transactional(readOnly = true)
    public ThirdPartyWorkshopRetentionPlanResponse get(Long caseId) {
        requireWorkshopAccess(caseId, "finanza.ver");
        return response(caseId, planRepository.findById(caseId).orElse(null));
    }

    /** Reemplazo idempotente de la planilla: no toca ni crea movimientos financieros. */
    @Transactional
    public ThirdPartyWorkshopRetentionPlanResponse save(Long caseId, ThirdPartyWorkshopRetentionRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = requireWorkshopAccess(caseId, "finanza.retencion.gestionar");
        List<ThirdPartyWorkshopRetentionRequest.Item> desired = normalized(request.retentions());
        ThirdPartyWorkshopRetentionPlanEntity plan = planRepository.findById(caseId).orElse(null);
        List<ThirdPartyWorkshopRetentionPlanResponse.Item> current = items(caseId);
        if (same(current, desired)) return response(caseId, plan);
        if (plan != null && request.expectedVersion() != null && !request.expectedVersion().equals(plan.getVersion())) {
            throw new ConflictException("Las retenciones fueron modificadas por otro usuario");
        }
        if (plan == null) {
            if (request.expectedVersion() != null && request.expectedVersion() != 0) throw new ConflictException("No existe una versión de retenciones para el caso");
            plan = new ThirdPartyWorkshopRetentionPlanEntity();
            plan.setCaseId(caseId);
        }
        plan.setUpdatedAt(LocalDateTime.now());
        plan = planRepository.saveAndFlush(plan);
        retentionRepository.deleteByCaseId(caseId);
        retentionRepository.flush();
        for (ThirdPartyWorkshopRetentionRequest.Item item : desired) {
            ThirdPartyWorkshopRetentionEntity entity = new ThirdPartyWorkshopRetentionEntity();
            entity.setCaseId(caseId);
            entity.setRetentionTypeCode(item.retentionTypeCode());
            entity.setAmount(item.amount());
            entity.setDetail(blankToNull(item.detail()));
            retentionRepository.save(entity);
        }
        caseAuditService.register(currentUser.id(), caseId, "caso_terceros_retenciones", caseId, "guardar_retenciones_independientes", null,
                caseAuditService.toJson(Map.of("count", desired.size())), caseAuditService.toJson(Map.of("domain", "terceros_taller")), httpRequest);
        return response(caseId, plan);
    }

    private AuthenticatedUser requireWorkshopAccess(Long caseId, String permission) {
        AuthenticatedUser user = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = caseRepository.findById(caseId).orElseThrow(() -> new ConflictException("No existe el caso " + caseId));
        String caseType = caseTypeRepository.findById(caseEntity.getCaseTypeId()).map(value -> value.getCode()).orElse("");
        if (!insuranceRepairCasePolicy.isThirdPartyWorkshopClaim(caseType)) throw new ConflictException("Las retenciones independientes solo aplican a RECLAMO_TERCEROS gestionado por Taller");
        accessControlService.requireCaseAccess(user, caseEntity, permission);
        return user;
    }

    private List<ThirdPartyWorkshopRetentionRequest.Item> normalized(List<ThirdPartyWorkshopRetentionRequest.Item> items) {
        Set<String> codes = new java.util.HashSet<>();
        List<ThirdPartyWorkshopRetentionRequest.Item> result = items.stream().filter(item -> item.amount() != null && item.amount().signum() > 0).map(item -> {
            String code = normalize(item.retentionTypeCode());
            if (!retentionTypeRepository.existsByCodeAndActiveTrue(code)) throw new ConflictException("retentionTypeCode no permitido: " + item.retentionTypeCode());
            if (!codes.add(code)) throw new ConflictException("No se puede repetir el tipo de retención: " + code);
            return new ThirdPartyWorkshopRetentionRequest.Item(code, item.amount(), blankToNull(item.detail()));
        }).sorted(Comparator.comparing(ThirdPartyWorkshopRetentionRequest.Item::retentionTypeCode)).toList();
        return result;
    }

    private boolean same(List<ThirdPartyWorkshopRetentionPlanResponse.Item> current, List<ThirdPartyWorkshopRetentionRequest.Item> desired) {
        return current.size() == desired.size() && java.util.stream.IntStream.range(0, current.size()).allMatch(index -> {
            var left = current.get(index); var right = desired.get(index);
            return left.retentionTypeCode().equals(right.retentionTypeCode()) && left.amount().compareTo(right.amount()) == 0 && java.util.Objects.equals(left.detail(), right.detail());
        });
    }

    private ThirdPartyWorkshopRetentionPlanResponse response(Long caseId, ThirdPartyWorkshopRetentionPlanEntity plan) { return new ThirdPartyWorkshopRetentionPlanResponse(caseId, plan == null ? 0L : plan.getVersion(), items(caseId)); }
    private List<ThirdPartyWorkshopRetentionPlanResponse.Item> items(Long caseId) { return retentionRepository.findByCaseIdOrderByRetentionTypeCodeAsc(caseId).stream().map(item -> new ThirdPartyWorkshopRetentionPlanResponse.Item(item.getId(), item.getRetentionTypeCode(), item.getAmount(), item.getDetail())).toList(); }
    private String normalize(String value) { return value == null || value.isBlank() ? null : value.trim().toUpperCase(); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
