package com.tallerzapata.backend.application.casefile;

import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.audit.AuditEventRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseCreationIdempotencyRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseIncidentRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CasePersonRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRelationRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseVehicleRepository;
import com.tallerzapata.backend.infrastructure.persistence.workflow.CaseStateHistoryRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class CaseDeletionService {

    private final CaseRepository caseRepository;
    private final CaseTypeRepository caseTypeRepository;
    private final CaseAccessControlService caseAccessControlService;
    private final CurrentUserService currentUserService;
    private final CaseAuditService caseAuditService;
    private final CaseActivityGuard caseActivityGuard;
    private final AuditEventRepository auditEventRepository;
    private final CaseStateHistoryRepository caseStateHistoryRepository;
    private final CasePersonRepository casePersonRepository;
    private final CaseVehicleRepository caseVehicleRepository;
    private final CaseIncidentRepository caseIncidentRepository;
    private final CaseRelationRepository caseRelationRepository;
    private final CaseCreationIdempotencyRepository caseCreationIdempotencyRepository;

    public CaseDeletionService(
            CaseRepository caseRepository,
            CaseTypeRepository caseTypeRepository,
            CaseAccessControlService caseAccessControlService,
            CurrentUserService currentUserService,
            CaseAuditService caseAuditService,
            CaseActivityGuard caseActivityGuard,
            AuditEventRepository auditEventRepository,
            CaseStateHistoryRepository caseStateHistoryRepository,
            CasePersonRepository casePersonRepository,
            CaseVehicleRepository caseVehicleRepository,
            CaseIncidentRepository caseIncidentRepository,
            CaseRelationRepository caseRelationRepository,
            CaseCreationIdempotencyRepository caseCreationIdempotencyRepository
    ) {
        this.caseRepository = caseRepository;
        this.caseTypeRepository = caseTypeRepository;
        this.caseAccessControlService = caseAccessControlService;
        this.currentUserService = currentUserService;
        this.caseAuditService = caseAuditService;
        this.caseActivityGuard = caseActivityGuard;
        this.auditEventRepository = auditEventRepository;
        this.caseStateHistoryRepository = caseStateHistoryRepository;
        this.casePersonRepository = casePersonRepository;
        this.caseVehicleRepository = caseVehicleRepository;
        this.caseIncidentRepository = caseIncidentRepository;
        this.caseRelationRepository = caseRelationRepository;
        this.caseCreationIdempotencyRepository = caseCreationIdempotencyRepository;
    }

    @Transactional
    public void delete(Long caseId, String reason, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity entity = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
        caseAccessControlService.requireCaseAccess(currentUser, entity, "caso.eliminar");

        String normalizedReason = blankToNull(reason);
        if (normalizedReason == null) {
            throw new ConflictException("El motivo de eliminacion es obligatorio");
        }
        caseActivityGuard.requireVirgin(entity, "eliminar");

        CaseTypeEntity caseType = caseTypeRepository.findById(entity.getCaseTypeId()).orElse(null);
        Map<String, Object> before = new LinkedHashMap<>();
        before.put("folderCode", entity.getFolderCode());
        before.put("orderNumber", entity.getOrderNumber());
        before.put("caseTypeCode", caseType == null ? null : caseType.getCode());
        before.put("organizationId", entity.getOrganizationId());
        before.put("branchId", entity.getBranchId());

        // El evento de eliminacion se registra con caseId nulo para que sobreviva al borrado en cascada
        // de la auditoria propia de la carpeta (auditoria_eventos referencia a casos sin ON DELETE CASCADE).
        caseAuditService.register(
                currentUser.id(),
                null,
                "casos",
                entity.getId(),
                "eliminar_caso",
                caseAuditService.toJson(before),
                null,
                caseAuditService.toJson(Map.of("reason", normalizedReason)),
                httpRequest
        );

        // Artefactos de creacion con FK sin ON DELETE CASCADE: se borran explicitamente.
        auditEventRepository.deleteByCaseId(entity.getId());
        caseStateHistoryRepository.deleteByCaseId(entity.getId());
        casePersonRepository.deleteByCaseId(entity.getId());
        caseVehicleRepository.deleteByCaseId(entity.getId());
        caseIncidentRepository.deleteByCaseId(entity.getId());
        caseRelationRepository.deleteBySourceCaseId(entity.getId());
        caseRelationRepository.deleteByTargetCaseId(entity.getId());
        caseCreationIdempotencyRepository.deleteByCaseId(entity.getId());

        // Las tablas hijas con ON DELETE CASCADE se limpian solas (vacias en una carpeta virgen).
        caseRepository.delete(entity);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
