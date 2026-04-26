package com.tallerzapata.backend.infrastructure.persistence.casefile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "casos")
public class CaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, updatable = false, columnDefinition = "char(36)")
    private String publicId;

    @Column(name = "codigo_carpeta", nullable = false)
    private String folderCode;

    @Column(name = "numero_orden", nullable = false)
    private Long orderNumber;

    @Column(name = "tipo_tramite_id", nullable = false)
    private Long caseTypeId;

    @Column(name = "organizacion_id", nullable = false)
    private Long organizationId;

    @Column(name = "sucursal_id", nullable = false)
    private Long branchId;

    @Column(name = "vehiculo_principal_id")
    private Long principalVehicleId;

    @Column(name = "cliente_principal_persona_id")
    private Long principalCustomerPersonId;

    @Column(name = "referenciado", nullable = false)
    private Boolean referenced;

    @Column(name = "referido_por_persona_id")
    private Long referredByPersonId;

    @Column(name = "referido_por_texto")
    private String referredByText;

    @Column(name = "usuario_creador_id", nullable = false)
    private Long createdByUserId;

    @Column(name = "estado_tramite_actual_id")
    private Long currentCaseStateId;

    @Column(name = "estado_reparacion_actual_id")
    private Long currentRepairStateId;

    @Column(name = "estado_pago_actual_id")
    private Long currentPaymentStateId;

    @Column(name = "estado_documentacion_actual_id")
    private Long currentDocumentationStateId;

    @Column(name = "estado_legal_actual_id")
    private Long currentLegalStateId;

    @Column(name = "prioridad_codigo")
    private String priorityCode;

    @Column(name = "fecha_cierre")
    private LocalDateTime closedAt;

    @Column(name = "observaciones_generales")
    private String generalObservations;

    @Column(name = "archived_at")
    private LocalDateTime archivedAt;

    @PrePersist
    void prePersist() {
        if (publicId == null) {
            publicId = UUID.randomUUID().toString();
        }
        if (referenced == null) {
            referenced = false;
        }
    }

    public Long getId() { return id; }
    public String getPublicId() { return publicId; }
    public String getFolderCode() { return folderCode; }
    public void setFolderCode(String folderCode) { this.folderCode = folderCode; }
    public Long getOrderNumber() { return orderNumber; }
    public void setOrderNumber(Long orderNumber) { this.orderNumber = orderNumber; }
    public Long getCaseTypeId() { return caseTypeId; }
    public void setCaseTypeId(Long caseTypeId) { this.caseTypeId = caseTypeId; }
    public Long getOrganizationId() { return organizationId; }
    public void setOrganizationId(Long organizationId) { this.organizationId = organizationId; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public Long getPrincipalVehicleId() { return principalVehicleId; }
    public void setPrincipalVehicleId(Long principalVehicleId) { this.principalVehicleId = principalVehicleId; }
    public Long getPrincipalCustomerPersonId() { return principalCustomerPersonId; }
    public void setPrincipalCustomerPersonId(Long principalCustomerPersonId) { this.principalCustomerPersonId = principalCustomerPersonId; }
    public Boolean getReferenced() { return referenced; }
    public void setReferenced(Boolean referenced) { this.referenced = referenced; }
    public Long getReferredByPersonId() { return referredByPersonId; }
    public void setReferredByPersonId(Long referredByPersonId) { this.referredByPersonId = referredByPersonId; }
    public String getReferredByText() { return referredByText; }
    public void setReferredByText(String referredByText) { this.referredByText = referredByText; }
    public Long getCreatedByUserId() { return createdByUserId; }
    public void setCreatedByUserId(Long createdByUserId) { this.createdByUserId = createdByUserId; }
    public Long getCurrentCaseStateId() { return currentCaseStateId; }
    public void setCurrentCaseStateId(Long currentCaseStateId) { this.currentCaseStateId = currentCaseStateId; }
    public Long getCurrentRepairStateId() { return currentRepairStateId; }
    public void setCurrentRepairStateId(Long currentRepairStateId) { this.currentRepairStateId = currentRepairStateId; }
    public Long getCurrentPaymentStateId() { return currentPaymentStateId; }
    public void setCurrentPaymentStateId(Long currentPaymentStateId) { this.currentPaymentStateId = currentPaymentStateId; }
    public Long getCurrentDocumentationStateId() { return currentDocumentationStateId; }
    public void setCurrentDocumentationStateId(Long currentDocumentationStateId) { this.currentDocumentationStateId = currentDocumentationStateId; }
    public Long getCurrentLegalStateId() { return currentLegalStateId; }
    public void setCurrentLegalStateId(Long currentLegalStateId) { this.currentLegalStateId = currentLegalStateId; }
    public String getPriorityCode() { return priorityCode; }
    public void setPriorityCode(String priorityCode) { this.priorityCode = priorityCode; }
    public LocalDateTime getClosedAt() { return closedAt; }
    public void setClosedAt(LocalDateTime closedAt) { this.closedAt = closedAt; }
    public String getGeneralObservations() { return generalObservations; }
    public void setGeneralObservations(String generalObservations) { this.generalObservations = generalObservations; }
    public LocalDateTime getArchivedAt() { return archivedAt; }
    public void setArchivedAt(LocalDateTime archivedAt) { this.archivedAt = archivedAt; }
}
