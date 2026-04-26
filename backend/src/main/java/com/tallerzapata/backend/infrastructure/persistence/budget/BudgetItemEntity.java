package com.tallerzapata.backend.infrastructure.persistence.budget;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "presupuesto_items")
public class BudgetItemEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "presupuesto_id", nullable = false) private Long budgetId;
    @Column(name = "orden_visual", nullable = false) private Integer visualOrder;
    @Column(name = "pieza_afectada", nullable = false) private String affectedPiece;
    @Column(name = "tarea_codigo") private String taskCode;
    @Column(name = "nivel_danio_codigo") private String damageLevelCode;
    @Column(name = "decision_repuesto_codigo") private String partDecisionCode;
    @Column(name = "accion_codigo") private String actionCode;
    @Column(name = "requiere_reemplazo", nullable = false) private Boolean requiresReplacement;
    @Column(name = "valor_repuesto", nullable = false) private BigDecimal partValue;
    @Column(name = "horas_estimadas") private BigDecimal estimatedHours;
    @Column(name = "importe_mano_obra", nullable = false) private BigDecimal laborAmount;
    @Column(name = "activo", nullable = false) private Boolean active;
    public Long getId(){return id;} public Long getBudgetId(){return budgetId;} public void setBudgetId(Long budgetId){this.budgetId=budgetId;} public Integer getVisualOrder(){return visualOrder;} public void setVisualOrder(Integer visualOrder){this.visualOrder=visualOrder;} public String getAffectedPiece(){return affectedPiece;} public void setAffectedPiece(String affectedPiece){this.affectedPiece=affectedPiece;} public String getTaskCode(){return taskCode;} public void setTaskCode(String taskCode){this.taskCode=taskCode;} public String getDamageLevelCode(){return damageLevelCode;} public void setDamageLevelCode(String damageLevelCode){this.damageLevelCode=damageLevelCode;} public String getPartDecisionCode(){return partDecisionCode;} public void setPartDecisionCode(String partDecisionCode){this.partDecisionCode=partDecisionCode;} public String getActionCode(){return actionCode;} public void setActionCode(String actionCode){this.actionCode=actionCode;} public Boolean getRequiresReplacement(){return requiresReplacement;} public void setRequiresReplacement(Boolean requiresReplacement){this.requiresReplacement=requiresReplacement;} public BigDecimal getPartValue(){return partValue;} public void setPartValue(BigDecimal partValue){this.partValue=partValue;} public BigDecimal getEstimatedHours(){return estimatedHours;} public void setEstimatedHours(BigDecimal estimatedHours){this.estimatedHours=estimatedHours;} public BigDecimal getLaborAmount(){return laborAmount;} public void setLaborAmount(BigDecimal laborAmount){this.laborAmount=laborAmount;} public Boolean getActive(){return active;} public void setActive(Boolean active){this.active=active;}
}
