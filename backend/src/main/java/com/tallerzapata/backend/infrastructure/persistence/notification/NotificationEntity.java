package com.tallerzapata.backend.infrastructure.persistence.notification;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "notificaciones")
public class NotificationEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "usuario_id", nullable = false) private Long userId;
    @Column(name = "caso_id") private Long caseId;
    @Column(name = "tipo_codigo", nullable = false) private String typeCode;
    @Column(name = "titulo", nullable = false) private String title;
    @Column(name = "mensaje", nullable = false, columnDefinition = "TEXT") private String message;
    @Column(name = "leida", nullable = false) private Boolean read;
    @Column(name = "leida_at") private LocalDateTime readAt;
    @Column(name = "accion_url") private String actionUrl;
    @Column(name = "entidad_tipo") private String entityType;
    @Column(name = "entidad_id") private Long entityId;
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;

    @PrePersist void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (read == null) read = false;
        if (createdAt == null) createdAt = now;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public String getTypeCode() { return typeCode; }
    public void setTypeCode(String typeCode) { this.typeCode = typeCode; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Boolean getRead() { return read; }
    public void setRead(Boolean read) { this.read = read; }
    public LocalDateTime getReadAt() { return readAt; }
    public void setReadAt(LocalDateTime readAt) { this.readAt = readAt; }
    public String getActionUrl() { return actionUrl; }
    public void setActionUrl(String actionUrl) { this.actionUrl = actionUrl; }
    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
