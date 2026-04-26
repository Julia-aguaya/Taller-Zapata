package com.tallerzapata.backend.infrastructure.persistence.finance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "movimiento_retenciones")
public class FinancialMovementRetentionEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "movimiento_id", nullable = false) private Long movementId;
    @Column(name = "tipo_retencion_codigo", nullable = false) private String retentionTypeCode;
    @Column(name = "monto", nullable = false) private BigDecimal amount;
    @Column(name = "detalle") private String detail;
    public Long getId() { return id; }
    public Long getMovementId() { return movementId; }
    public void setMovementId(Long movementId) { this.movementId = movementId; }
    public String getRetentionTypeCode() { return retentionTypeCode; }
    public void setRetentionTypeCode(String retentionTypeCode) { this.retentionTypeCode = retentionTypeCode; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }
}
