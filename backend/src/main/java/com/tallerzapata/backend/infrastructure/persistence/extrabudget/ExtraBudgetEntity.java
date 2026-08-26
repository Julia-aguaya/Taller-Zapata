package com.tallerzapata.backend.infrastructure.persistence.extrabudget;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "presupuestos_extra")
public class ExtraBudgetEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "caso_id", nullable = false) private Long caseId;
    @Column(name = "organizacion_id", nullable = false) private Long organizationId;
    @Column(name = "sucursal_id", nullable = false) private Long branchId;
    @Column(name = "numero_emitido") private Long issuedNumber;
    @Column(name = "version_actual", nullable = false) private Integer currentVersion;
    @Column(name = "version_aceptada_id") private Long acceptedVersionId;
    @Column(name = "monto_deuda_aceptada", nullable = false) private BigDecimal acceptedDebtAmount;
    @Enumerated(EnumType.STRING) @Column(name = "estado_actual", nullable = false) private ExtraBudgetStatus currentStatus;
    @Column(name = "confirmacion_cliente", nullable = false) private String customerConfirmation;
    @Column(name = "confirmado_at") private LocalDateTime confirmedAt;
    @Column(name = "confirmado_by") private Long confirmedBy;
    @Column(name = "revertido_at") private LocalDateTime reversedAt;
    @Column(name = "revertido_by") private Long reversedBy;
    @Column(name = "motivo_reversion") private String reversalReason;
    @Column(name = "activo", nullable = false) private Boolean active;
    @Version @Column(name = "version_lock", nullable = false) private Long versionLock;
    @Column(name = "created_at", insertable = false, updatable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at", insertable = false) private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public Long getOrganizationId() { return organizationId; }
    public void setOrganizationId(Long organizationId) { this.organizationId = organizationId; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public Long getIssuedNumber() { return issuedNumber; }
    public void setIssuedNumber(Long issuedNumber) { this.issuedNumber = issuedNumber; }
    public Integer getCurrentVersion() { return currentVersion; }
    public void setCurrentVersion(Integer currentVersion) { this.currentVersion = currentVersion; }
    public Long getAcceptedVersionId() { return acceptedVersionId; }
    public void setAcceptedVersionId(Long acceptedVersionId) { this.acceptedVersionId = acceptedVersionId; }
    public BigDecimal getAcceptedDebtAmount() { return acceptedDebtAmount; }
    public void setAcceptedDebtAmount(BigDecimal acceptedDebtAmount) { this.acceptedDebtAmount = acceptedDebtAmount; }
    public ExtraBudgetStatus getCurrentStatus() { return currentStatus; }
    public void setCurrentStatus(ExtraBudgetStatus currentStatus) { this.currentStatus = currentStatus; }
    public String getCustomerConfirmation() { return customerConfirmation; }
    public void setCustomerConfirmation(String customerConfirmation) { this.customerConfirmation = customerConfirmation; }
    public LocalDateTime getConfirmedAt() { return confirmedAt; }
    public void setConfirmedAt(LocalDateTime confirmedAt) { this.confirmedAt = confirmedAt; }
    public Long getConfirmedBy() { return confirmedBy; }
    public void setConfirmedBy(Long confirmedBy) { this.confirmedBy = confirmedBy; }
    public LocalDateTime getReversedAt() { return reversedAt; }
    public void setReversedAt(LocalDateTime reversedAt) { this.reversedAt = reversedAt; }
    public Long getReversedBy() { return reversedBy; }
    public void setReversedBy(Long reversedBy) { this.reversedBy = reversedBy; }
    public String getReversalReason() { return reversalReason; }
    public void setReversalReason(String reversalReason) { this.reversalReason = reversalReason; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Long getVersionLock() { return versionLock; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
