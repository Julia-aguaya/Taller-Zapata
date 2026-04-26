package com.tallerzapata.backend.infrastructure.persistence.finance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "movimientos_financieros")
public class FinancialMovementEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "public_id", nullable = false, updatable = false, columnDefinition = "char(36)")
    private String publicId;
    @Column(name = "caso_id", nullable = false) private Long caseId;
    @Column(name = "comprobante_id") private Long receiptId;
    @Column(name = "tipo_movimiento_codigo", nullable = false) private String movementTypeCode;
    @Column(name = "origen_flujo_codigo", nullable = false) private String flowOriginCode;
    @Column(name = "contraparte_tipo_codigo", nullable = false) private String counterpartyTypeCode;
    @Column(name = "contraparte_persona_id") private Long counterpartyPersonId;
    @Column(name = "contraparte_compania_id") private Long counterpartyCompanyId;
    @Column(name = "fecha_movimiento", nullable = false) private LocalDateTime movementAt;
    @Column(name = "monto_bruto", nullable = false) private BigDecimal grossAmount;
    @Column(name = "monto_neto", nullable = false) private BigDecimal netAmount;
    @Column(name = "medio_pago_codigo", nullable = false) private String paymentMethodCode;
    @Column(name = "medio_pago_detalle") private String paymentMethodDetail;
    @Column(name = "cancela_tipo_codigo") private String cancellationTypeCode;
    @Column(name = "es_senia", nullable = false) private Boolean advancePayment;
    @Column(name = "es_bonificacion", nullable = false) private Boolean bonification;
    @Column(name = "motivo") private String reason;
    @Column(name = "referencia_externa") private String externalReference;
    @Column(name = "registrado_por", nullable = false) private Long registeredBy;
    @Column(name = "created_at", insertable = false, updatable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at", insertable = false, updatable = false) private LocalDateTime updatedAt;

    @PrePersist void prePersist() { if (publicId == null) { publicId = UUID.randomUUID().toString(); } if (advancePayment == null) advancePayment = false; if (bonification == null) bonification = false; }
    public Long getId() { return id; }
    public String getPublicId() { return publicId; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public Long getReceiptId() { return receiptId; }
    public void setReceiptId(Long receiptId) { this.receiptId = receiptId; }
    public String getMovementTypeCode() { return movementTypeCode; }
    public void setMovementTypeCode(String movementTypeCode) { this.movementTypeCode = movementTypeCode; }
    public String getFlowOriginCode() { return flowOriginCode; }
    public void setFlowOriginCode(String flowOriginCode) { this.flowOriginCode = flowOriginCode; }
    public String getCounterpartyTypeCode() { return counterpartyTypeCode; }
    public void setCounterpartyTypeCode(String counterpartyTypeCode) { this.counterpartyTypeCode = counterpartyTypeCode; }
    public Long getCounterpartyPersonId() { return counterpartyPersonId; }
    public void setCounterpartyPersonId(Long counterpartyPersonId) { this.counterpartyPersonId = counterpartyPersonId; }
    public Long getCounterpartyCompanyId() { return counterpartyCompanyId; }
    public void setCounterpartyCompanyId(Long counterpartyCompanyId) { this.counterpartyCompanyId = counterpartyCompanyId; }
    public LocalDateTime getMovementAt() { return movementAt; }
    public void setMovementAt(LocalDateTime movementAt) { this.movementAt = movementAt; }
    public BigDecimal getGrossAmount() { return grossAmount; }
    public void setGrossAmount(BigDecimal grossAmount) { this.grossAmount = grossAmount; }
    public BigDecimal getNetAmount() { return netAmount; }
    public void setNetAmount(BigDecimal netAmount) { this.netAmount = netAmount; }
    public String getPaymentMethodCode() { return paymentMethodCode; }
    public void setPaymentMethodCode(String paymentMethodCode) { this.paymentMethodCode = paymentMethodCode; }
    public String getPaymentMethodDetail() { return paymentMethodDetail; }
    public void setPaymentMethodDetail(String paymentMethodDetail) { this.paymentMethodDetail = paymentMethodDetail; }
    public String getCancellationTypeCode() { return cancellationTypeCode; }
    public void setCancellationTypeCode(String cancellationTypeCode) { this.cancellationTypeCode = cancellationTypeCode; }
    public Boolean getAdvancePayment() { return advancePayment; }
    public void setAdvancePayment(Boolean advancePayment) { this.advancePayment = advancePayment; }
    public Boolean getBonification() { return bonification; }
    public void setBonification(Boolean bonification) { this.bonification = bonification; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getExternalReference() { return externalReference; }
    public void setExternalReference(String externalReference) { this.externalReference = externalReference; }
    public Long getRegisteredBy() { return registeredBy; }
    public void setRegisteredBy(Long registeredBy) { this.registeredBy = registeredBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
