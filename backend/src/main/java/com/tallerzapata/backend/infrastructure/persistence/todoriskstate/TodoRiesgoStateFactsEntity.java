package com.tallerzapata.backend.infrastructure.persistence.todoriskstate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "todo_riesgo_state_facts")
public class TodoRiesgoStateFactsEntity {
    @Id @Column(name = "caso_id") private Long caseId;
    @Column(name = "fecha_acuerdo") private LocalDate agreementDate;
    @Column(name = "fecha_pasado_a_pagos") private LocalDate passedToPaymentsDate;
    @Column(name = "fecha_pago") private LocalDate paymentDate;
    @Column(name = "no_repara_activo", nullable = false) private Boolean noRepairActive;
    @Column(name = "no_repara_motivo") private String noRepairReason;
    @Column(name = "no_repara_fecha") private LocalDateTime noRepairAt;
    @Column(name = "no_repara_actor_usuario_id") private Long noRepairActorUserId;
    @Column(name = "no_repara_revertido_fecha") private LocalDateTime noRepairRevertedAt;
    @Column(name = "no_repara_revertido_actor_usuario_id") private Long noRepairRevertedActorUserId;
    @Column(name = "no_repara_revertido_motivo") private String noRepairRevertedReason;
    public Long getCaseId() { return caseId; } public void setCaseId(Long value) { caseId = value; }
    public LocalDate getAgreementDate() { return agreementDate; } public void setAgreementDate(LocalDate value) { agreementDate = value; }
    public LocalDate getPassedToPaymentsDate() { return passedToPaymentsDate; } public void setPassedToPaymentsDate(LocalDate value) { passedToPaymentsDate = value; }
    public LocalDate getPaymentDate() { return paymentDate; } public void setPaymentDate(LocalDate value) { paymentDate = value; }
    public Boolean getNoRepairActive() { return noRepairActive; } public void setNoRepairActive(Boolean value) { noRepairActive = value; }
    public String getNoRepairReason() { return noRepairReason; } public void setNoRepairReason(String value) { noRepairReason = value; }
    public LocalDateTime getNoRepairAt() { return noRepairAt; } public void setNoRepairAt(LocalDateTime value) { noRepairAt = value; }
    public Long getNoRepairActorUserId() { return noRepairActorUserId; } public void setNoRepairActorUserId(Long value) { noRepairActorUserId = value; }
    public LocalDateTime getNoRepairRevertedAt() { return noRepairRevertedAt; } public void setNoRepairRevertedAt(LocalDateTime value) { noRepairRevertedAt = value; }
    public Long getNoRepairRevertedActorUserId() { return noRepairRevertedActorUserId; } public void setNoRepairRevertedActorUserId(Long value) { noRepairRevertedActorUserId = value; }
    public String getNoRepairRevertedReason() { return noRepairRevertedReason; } public void setNoRepairRevertedReason(String value) { noRepairRevertedReason = value; }
}
