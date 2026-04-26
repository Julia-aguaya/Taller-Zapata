package com.tallerzapata.backend.infrastructure.persistence.finance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "movimiento_aplicaciones")
public class FinancialMovementApplicationEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "movimiento_id", nullable = false) private Long movementId;
    @Column(name = "caso_id", nullable = false) private Long caseId;
    @Column(name = "concepto_codigo", nullable = false) private String conceptCode;
    @Column(name = "entidad_tipo", nullable = false) private String entityType;
    @Column(name = "entidad_id", nullable = false) private Long entityId;
    @Column(name = "monto_aplicado", nullable = false) private BigDecimal appliedAmount;
    public Long getId() { return id; }
    public Long getMovementId() { return movementId; }
    public void setMovementId(Long movementId) { this.movementId = movementId; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public String getConceptCode() { return conceptCode; }
    public void setConceptCode(String conceptCode) { this.conceptCode = conceptCode; }
    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }
    public BigDecimal getAppliedAmount() { return appliedAmount; }
    public void setAppliedAmount(BigDecimal appliedAmount) { this.appliedAmount = appliedAmount; }
}
