package com.tallerzapata.backend.application.casefile;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tallerzapata.backend.api.casefile.CaseAuditEventResponse;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.audit.AuditEventEntity;
import com.tallerzapata.backend.infrastructure.persistence.audit.AuditEventRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CaseAuditService {

    private final AuditEventRepository auditEventRepository;
    private final ObjectMapper objectMapper;
    private final CaseRepository caseRepository;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService caseAccessControlService;

    public CaseAuditService(
            AuditEventRepository auditEventRepository,
            ObjectMapper objectMapper,
            CaseRepository caseRepository,
            CurrentUserService currentUserService,
            CaseAccessControlService caseAccessControlService
    ) {
        this.auditEventRepository = auditEventRepository;
        this.objectMapper = objectMapper;
        this.caseRepository = caseRepository;
        this.currentUserService = currentUserService;
        this.caseAccessControlService = caseAccessControlService;
    }

    public void register(
            Long userId,
            Long caseId,
            String entityType,
            Long entityId,
            String actionCode,
            String beforeJson,
            String afterJson,
            String metadataJson,
            HttpServletRequest request
    ) {
        AuditEventEntity entity = new AuditEventEntity();
        entity.setUserId(userId);
        entity.setCaseId(caseId);
        entity.setEntityType(entityType);
        entity.setEntityId(entityId);
        entity.setActionCode(actionCode);
        entity.setBeforeJson(beforeJson);
        entity.setAfterJson(afterJson);
        entity.setMetadataJson(metadataJson);
        entity.setSourceIp(request == null ? null : request.getRemoteAddr());
        entity.setUserAgent(request == null ? null : request.getHeader("User-Agent"));
        auditEventRepository.save(entity);
    }

    public String toJson(Object payload) {
        if (payload == null) {
            return null;
        }

        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("No se pudo serializar JSON de auditoria", exception);
        }
    }

    public List<CaseAuditEventResponse> listCaseAuditEvents(
            Long caseId,
            String actionCode,
            String domain,
            Long userId,
            int page,
            int size
    ) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        CaseEntity caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el caso " + caseId));
        caseAccessControlService.requireCaseAccess(currentUser, caseEntity, "auditoria.ver");

        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 200);

        return auditEventRepository.findByCaseIdOrderByIdDesc(caseId, PageRequest.of(normalizedPage, normalizedSize))
                .stream()
                .filter(event -> actionCode == null || event.getActionCode().equals(actionCode))
                .filter(event -> userId == null || userId.equals(event.getUserId()))
                .filter(event -> {
                    if (domain == null || domain.isBlank()) {
                        return true;
                    }
                    String extracted = extractDomain(event);
                    return domain.equals(extracted);
                })
                .map(this::toResponse)
                .toList();
    }

    private CaseAuditEventResponse toResponse(AuditEventEntity event) {
        return new CaseAuditEventResponse(
                event.getId(),
                event.getUserId(),
                event.getCaseId(),
                event.getEntityType(),
                event.getEntityId(),
                event.getActionCode(),
                extractDomain(event),
                event.getBeforeJson(),
                event.getAfterJson(),
                event.getMetadataJson(),
                event.getSourceIp(),
                event.getUserAgent(),
                event.getCreatedAt()
        );
    }

    private String extractDomain(AuditEventEntity event) {
        String domain = extractDomainFromJson(event.getAfterJson());
        if (domain != null) {
            return domain;
        }
        domain = extractDomainFromJson(event.getBeforeJson());
        if (domain != null) {
            return domain;
        }
        return extractDomainFromJson(event.getMetadataJson());
    }

    private String extractDomainFromJson(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }

        try {
            JsonNode node = objectMapper.readTree(json);
            if (!node.has("domain") || node.get("domain").isNull()) {
                return null;
            }
            return node.get("domain").asText();
        } catch (Exception exception) {
            return null;
        }
    }
}
