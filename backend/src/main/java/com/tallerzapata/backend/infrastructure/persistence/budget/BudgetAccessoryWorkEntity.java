package com.tallerzapata.backend.infrastructure.persistence.budget;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "presupuesto_trabajos_extras")
public class BudgetAccessoryWorkEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "presupuesto_id", nullable = false) private Long budgetId;
    @Column(name = "pieza_afectada") private String affectedPiece;
    @Column(name = "accion_codigo") private String actionCode;
    @Column(name = "nivel_danio_codigo") private String damageLevelCode;
    @Column(name = "monto_repuestos", nullable = false) private BigDecimal replacementAmount;
    @Column(name = "activo", nullable = false) private Boolean active;

    public Long getId() { return id; }
    public Long getBudgetId() { return budgetId; }
    public void setBudgetId(Long budgetId) { this.budgetId = budgetId; }
    public String getAffectedPiece() { return affectedPiece; }
    public void setAffectedPiece(String affectedPiece) { this.affectedPiece = affectedPiece; }
    public String getActionCode() { return actionCode; }
    public void setActionCode(String actionCode) { this.actionCode = actionCode; }
    public String getDamageLevelCode() { return damageLevelCode; }
    public void setDamageLevelCode(String damageLevelCode) { this.damageLevelCode = damageLevelCode; }
    public BigDecimal getReplacementAmount() { return replacementAmount; }
    public void setReplacementAmount(BigDecimal replacementAmount) { this.replacementAmount = replacementAmount; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
