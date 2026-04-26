package com.tallerzapata.backend.infrastructure.persistence.operation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tareas")
public class OperationalTaskEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, updatable = false, columnDefinition = "char(36)")
    private String publicId;

    @Column(name = "caso_id")
    private Long caseId;

    @Column(name = "organizacion_id", nullable = false)
    private Long organizationId;

    @Column(name = "sucursal_id")
    private Long branchId;

    @Column(name = "modulo_origen_codigo")
    private String originModuleCode;

    @Column(name = "subtab_origen_codigo")
    private String originSubtabCode;

    @Column(name = "titulo", nullable = false)
    private String title;

    @Column(name = "descripcion")
    private String description;

    @Column(name = "fecha_limite")
    private LocalDate dueDate;

    @Column(name = "prioridad_codigo", nullable = false)
    private String priorityCode;

    @Column(name = "estado_codigo", nullable = false)
    private String statusCode;

    @Column(name = "usuario_asignado_id")
    private Long assignedUserId;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "resuelta", nullable = false)
    private Boolean resolved;

    @Column(name = "resuelta_at")
    private LocalDateTime resolvedAt;

    @Column(name = "payload_json")
    private String payloadJson;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        if (publicId == null) {
            publicId = UUID.randomUUID().toString();
        }
        if (resolved == null) {
            resolved = false;
        }
    }

    public Long getId() { return id; }
    public String getPublicId() { return publicId; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public Long getOrganizationId() { return organizationId; }
    public void setOrganizationId(Long organizationId) { this.organizationId = organizationId; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public String getOriginModuleCode() { return originModuleCode; }
    public void setOriginModuleCode(String originModuleCode) { this.originModuleCode = originModuleCode; }
    public String getOriginSubtabCode() { return originSubtabCode; }
    public void setOriginSubtabCode(String originSubtabCode) { this.originSubtabCode = originSubtabCode; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public String getPriorityCode() { return priorityCode; }
    public void setPriorityCode(String priorityCode) { this.priorityCode = priorityCode; }
    public String getStatusCode() { return statusCode; }
    public void setStatusCode(String statusCode) { this.statusCode = statusCode; }
    public Long getAssignedUserId() { return assignedUserId; }
    public void setAssignedUserId(Long assignedUserId) { this.assignedUserId = assignedUserId; }
    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }
    public Boolean getResolved() { return resolved; }
    public void setResolved(Boolean resolved) { this.resolved = resolved; }
    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
    public String getPayloadJson() { return payloadJson; }
    public void setPayloadJson(String payloadJson) { this.payloadJson = payloadJson; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
