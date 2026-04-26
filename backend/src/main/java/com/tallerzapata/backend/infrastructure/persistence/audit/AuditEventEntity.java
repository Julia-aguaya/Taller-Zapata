package com.tallerzapata.backend.infrastructure.persistence.audit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "auditoria_eventos")
public class AuditEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id")
    private Long userId;

    @Column(name = "caso_id")
    private Long caseId;

    @Column(name = "entidad_tipo", nullable = false)
    private String entityType;

    @Column(name = "entidad_id")
    private Long entityId;

    @Column(name = "accion_codigo", nullable = false)
    private String actionCode;

    @Column(name = "antes_json")
    @Lob
    private String beforeJson;

    @Column(name = "despues_json")
    @Lob
    private String afterJson;

    @Column(name = "metadata_json")
    @Lob
    private String metadataJson;

    @Column(name = "ip_origen")
    private String sourceIp;

    @Column(name = "user_agent")
    private String userAgent;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Long getCaseId() { return caseId; }
    public String getEntityType() { return entityType; }
    public Long getEntityId() { return entityId; }
    public String getActionCode() { return actionCode; }
    public String getBeforeJson() { return beforeJson; }
    public String getAfterJson() { return afterJson; }
    public String getMetadataJson() { return metadataJson; }
    public String getSourceIp() { return sourceIp; }
    public String getUserAgent() { return userAgent; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }
    public void setActionCode(String actionCode) { this.actionCode = actionCode; }
    public void setBeforeJson(String beforeJson) { this.beforeJson = beforeJson; }
    public void setAfterJson(String afterJson) { this.afterJson = afterJson; }
    public void setMetadataJson(String metadataJson) { this.metadataJson = metadataJson; }
    public void setSourceIp(String sourceIp) { this.sourceIp = sourceIp; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
}
