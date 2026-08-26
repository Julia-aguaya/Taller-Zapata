package com.tallerzapata.backend.infrastructure.persistence.extrabudget;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "presupuesto_extra_pago_aplicaciones")
public class ExtraBudgetPaymentApplicationEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "movimiento_id", nullable = false) private Long movementId;
    @Column(name = "presupuesto_extra_id", nullable = false) private Long extraBudgetId;
    @Column(name = "presupuesto_extra_version_id", nullable = false) private Long extraBudgetVersionId;
    @Column(name = "monto_aplicado", nullable = false) private BigDecimal appliedAmount;
    @Column(name = "revierte_aplicacion_id") private Long reversedApplicationId;
    @Column(name = "created_at", insertable = false, updatable = false) private LocalDateTime createdAt;

    public Long getId() { return id; }
    public Long getMovementId() { return movementId; }
    public void setMovementId(Long movementId) { this.movementId = movementId; }
    public Long getExtraBudgetId() { return extraBudgetId; }
    public void setExtraBudgetId(Long extraBudgetId) { this.extraBudgetId = extraBudgetId; }
    public Long getExtraBudgetVersionId() { return extraBudgetVersionId; }
    public void setExtraBudgetVersionId(Long extraBudgetVersionId) { this.extraBudgetVersionId = extraBudgetVersionId; }
    public BigDecimal getAppliedAmount() { return appliedAmount; }
    public void setAppliedAmount(BigDecimal appliedAmount) { this.appliedAmount = appliedAmount; }
    public Long getReversedApplicationId() { return reversedApplicationId; }
    public void setReversedApplicationId(Long reversedApplicationId) { this.reversedApplicationId = reversedApplicationId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
