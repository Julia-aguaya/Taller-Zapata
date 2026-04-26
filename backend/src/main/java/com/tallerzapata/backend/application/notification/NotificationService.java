package com.tallerzapata.backend.application.notification;

import com.tallerzapata.backend.api.notification.NotificationCreateRequest;
import com.tallerzapata.backend.api.notification.NotificationResponse;
import com.tallerzapata.backend.application.casefile.CaseAuditService;
import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.application.common.ForbiddenException;
import com.tallerzapata.backend.application.common.ResourceNotFoundException;
import com.tallerzapata.backend.application.security.CaseAccessControlService;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.notification.NotificationEntity;
import com.tallerzapata.backend.infrastructure.persistence.notification.NotificationRepository;
import com.tallerzapata.backend.infrastructure.persistence.notification.NotificationTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.security.UserRepository;
import com.tallerzapata.backend.infrastructure.security.AuthenticatedUser;
import com.tallerzapata.backend.infrastructure.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationTypeRepository notificationTypeRepository;
    private final UserRepository userRepository;
    private final CaseRepository caseRepository;
    private final CurrentUserService currentUserService;
    private final CaseAccessControlService accessControlService;
    private final CaseAuditService caseAuditService;

    public NotificationService(NotificationRepository notificationRepository,
                               NotificationTypeRepository notificationTypeRepository,
                               UserRepository userRepository,
                               CaseRepository caseRepository,
                               CurrentUserService currentUserService,
                               CaseAccessControlService accessControlService,
                               CaseAuditService caseAuditService) {
        this.notificationRepository = notificationRepository;
        this.notificationTypeRepository = notificationTypeRepository;
        this.userRepository = userRepository;
        this.caseRepository = caseRepository;
        this.currentUserService = currentUserService;
        this.accessControlService = accessControlService;
        this.caseAuditService = caseAuditService;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> listUnreadNotifications() {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        accessControlService.requirePermission(currentUser, "notificacion.ver");
        return notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(currentUser.id())
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> listAllNotifications() {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        accessControlService.requirePermission(currentUser, "notificacion.ver");
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(currentUser.id())
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public long countUnreadNotifications() {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        accessControlService.requirePermission(currentUser, "notificacion.ver");
        return notificationRepository.countByUserIdAndReadFalse(currentUser.id());
    }

    @Transactional
    public NotificationResponse markAsRead(Long notificationId, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        accessControlService.requirePermission(currentUser, "notificacion.ver");
        NotificationEntity entity = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe la notificacion " + notificationId));
        if (!entity.getUserId().equals(currentUser.id())) {
            throw new ForbiddenException("La notificacion no pertenece al usuario actual");
        }
        entity.setRead(true);
        entity.setReadAt(LocalDateTime.now());
        entity = notificationRepository.save(entity);
        caseAuditService.register(currentUser.id(), entity.getCaseId(), "notificaciones", entity.getId(), "marcar_notificacion_leida", null, caseAuditService.toJson(Map.of("read", true)), caseAuditService.toJson(Map.of("domain", "notificaciones")), httpRequest);
        return toResponse(entity);
    }

    @Transactional
    public NotificationResponse createNotification(NotificationCreateRequest request, HttpServletRequest httpRequest) {
        AuthenticatedUser currentUser = currentUserService.requireCurrentUser();
        accessControlService.requirePermission(currentUser, "notificacion.crear");
        if (!userRepository.existsById(request.userId())) {
            throw new ResourceNotFoundException("No existe el usuario " + request.userId());
        }
        String typeCode = normalizeCode(request.typeCode());
        if (typeCode == null || !notificationTypeRepository.existsById(typeCode)) {
            throw new ConflictException("tipo_codigo no permitido: " + request.typeCode());
        }
        if (request.caseId() != null && !caseRepository.existsById(request.caseId())) {
            throw new ResourceNotFoundException("No existe el caso " + request.caseId());
        }
        NotificationEntity entity = new NotificationEntity();
        entity.setUserId(request.userId());
        entity.setCaseId(request.caseId());
        entity.setTypeCode(typeCode);
        entity.setTitle(request.title().trim());
        entity.setMessage(request.message().trim());
        entity.setActionUrl(blankToNull(request.actionUrl()));
        entity.setEntityType(blankToNull(request.entityType()));
        entity.setEntityId(request.entityId());
        entity = notificationRepository.save(entity);
        caseAuditService.register(currentUser.id(), entity.getCaseId(), "notificaciones", entity.getId(), "crear_notificacion", null, caseAuditService.toJson(Map.of("userId", entity.getUserId(), "typeCode", entity.getTypeCode())), caseAuditService.toJson(Map.of("domain", "notificaciones")), httpRequest);
        return toResponse(entity);
    }

    private NotificationResponse toResponse(NotificationEntity e) {
        return new NotificationResponse(e.getId(), e.getUserId(), e.getCaseId(), e.getTypeCode(), e.getTitle(), e.getMessage(), e.getRead(), e.getReadAt(), e.getActionUrl(), e.getEntityType(), e.getEntityId(), e.getCreatedAt());
    }

    private String normalizeCode(String value) { return value == null || value.isBlank() ? null : value.trim().toUpperCase(); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
