package com.tallerzapata.backend.infrastructure.persistence.insurance;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "aprobaciones_acuerdo_bajo_minimo")
public class BelowMinimumAgreementApprovalEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "caso_id", nullable = false) private Long caseId;
    @Column(name = "monto_propuesto", nullable = false) private BigDecimal proposedAmount;
    @Column(name = "monto_minimo_esperado", nullable = false) private BigDecimal expectedMinimumAmount;
    @Column(name = "usuario_solicitante_id", nullable = false) private Long requestedByUserId;
    @Column(name = "motivo", nullable = false) private String reason;
    @Column(name = "solicitado_en", nullable = false) private LocalDateTime requestedAt;
    @Column(name = "estado", nullable = false) private String status;
    @Column(name = "decidido_en") private LocalDateTime decidedAt;
    @Column(name = "administrador_aprobador_id") private Long approvedByAdminId;

    public Long getId() { return id; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public BigDecimal getProposedAmount() { return proposedAmount; }
    public void setProposedAmount(BigDecimal proposedAmount) { this.proposedAmount = proposedAmount; }
    public BigDecimal getExpectedMinimumAmount() { return expectedMinimumAmount; }
    public void setExpectedMinimumAmount(BigDecimal expectedMinimumAmount) { this.expectedMinimumAmount = expectedMinimumAmount; }
    public Long getRequestedByUserId() { return requestedByUserId; }
    public void setRequestedByUserId(Long requestedByUserId) { this.requestedByUserId = requestedByUserId; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public LocalDateTime getRequestedAt() { return requestedAt; }
    public void setRequestedAt(LocalDateTime requestedAt) { this.requestedAt = requestedAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getDecidedAt() { return decidedAt; }
    public void setDecidedAt(LocalDateTime decidedAt) { this.decidedAt = decidedAt; }
    public Long getApprovedByAdminId() { return approvedByAdminId; }
    public void setApprovedByAdminId(Long approvedByAdminId) { this.approvedByAdminId = approvedByAdminId; }
}
