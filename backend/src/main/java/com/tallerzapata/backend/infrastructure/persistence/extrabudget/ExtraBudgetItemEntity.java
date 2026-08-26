package com.tallerzapata.backend.infrastructure.persistence.extrabudget;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "presupuesto_extra_items")
public class ExtraBudgetItemEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "presupuesto_extra_version_id", nullable = false) private Long extraBudgetVersionId;
    @Column(name = "orden_visual", nullable = false) private Integer visualOrder;
    @Column(name = "descripcion", nullable = false) private String description;
    @Column(name = "cantidad", nullable = false) private BigDecimal quantity;
    @Column(name = "importe_unitario_repuesto", nullable = false) private BigDecimal partUnitAmount;
    @Column(name = "importe_unitario_mano_obra", nullable = false) private BigDecimal laborUnitAmount;
    @Column(name = "total_repuestos", nullable = false) private BigDecimal partsTotal;
    @Column(name = "total_mano_obra", nullable = false) private BigDecimal laborTotal;
    @Column(name = "total_linea", nullable = false) private BigDecimal lineTotal;
    @Column(name = "source_type") private String sourceType;
    @Column(name = "source_id") private Long sourceId;
    @Column(name = "pieza_afectada") private String affectedPiece;
    @Column(name = "tarea_codigo") private String taskCode;
    @Column(name = "nivel_danio_codigo") private String damageLevelCode;
    @Column(name = "monto_repuestos") private BigDecimal partsAmount;
    @Column(name = "activo", nullable = false) private Boolean active = true;
    @Column(name = "accion_codigo") private String actionCode;
    @Column(name = "proveedor_seleccionado_id") private Long selectedProviderId;
    @Column(name = "proveedor_seleccionado_nombre") private String selectedProviderName;
    @Column(name = "importe_cotizacion_seleccionada") private BigDecimal selectedQuoteAmount;

    public Long getId() { return id; }
    public Long getExtraBudgetVersionId() { return extraBudgetVersionId; }
    public void setExtraBudgetVersionId(Long extraBudgetVersionId) { this.extraBudgetVersionId = extraBudgetVersionId; }
    public Integer getVisualOrder() { return visualOrder; }
    public void setVisualOrder(Integer visualOrder) { this.visualOrder = visualOrder; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public BigDecimal getPartUnitAmount() { return partUnitAmount; }
    public void setPartUnitAmount(BigDecimal partUnitAmount) { this.partUnitAmount = partUnitAmount; }
    public BigDecimal getLaborUnitAmount() { return laborUnitAmount; }
    public void setLaborUnitAmount(BigDecimal laborUnitAmount) { this.laborUnitAmount = laborUnitAmount; }
    public BigDecimal getPartsTotal() { return partsTotal; }
    public void setPartsTotal(BigDecimal partsTotal) { this.partsTotal = partsTotal; }
    public BigDecimal getLaborTotal() { return laborTotal; }
    public void setLaborTotal(BigDecimal laborTotal) { this.laborTotal = laborTotal; }
    public BigDecimal getLineTotal() { return lineTotal; }
    public void setLineTotal(BigDecimal lineTotal) { this.lineTotal = lineTotal; }
    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    public Long getSourceId() { return sourceId; }
    public void setSourceId(Long sourceId) { this.sourceId = sourceId; }
    public String getAffectedPiece() { return affectedPiece; }
    public void setAffectedPiece(String affectedPiece) { this.affectedPiece = affectedPiece; }
    public String getTaskCode() { return taskCode; }
    public void setTaskCode(String taskCode) { this.taskCode = taskCode; }
    public String getDamageLevelCode() { return damageLevelCode; }
    public void setDamageLevelCode(String damageLevelCode) { this.damageLevelCode = damageLevelCode; }
    public BigDecimal getPartsAmount() { return partsAmount; }
    public void setPartsAmount(BigDecimal partsAmount) { this.partsAmount = partsAmount; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public String getActionCode() { return actionCode; }
    public void setActionCode(String actionCode) { this.actionCode = actionCode; }
    public Long getSelectedProviderId() { return selectedProviderId; }
    public void setSelectedProviderId(Long selectedProviderId) { this.selectedProviderId = selectedProviderId; }
    public String getSelectedProviderName() { return selectedProviderName; }
    public void setSelectedProviderName(String selectedProviderName) { this.selectedProviderName = selectedProviderName; }
    public BigDecimal getSelectedQuoteAmount() { return selectedQuoteAmount; }
    public void setSelectedQuoteAmount(BigDecimal selectedQuoteAmount) { this.selectedQuoteAmount = selectedQuoteAmount; }
    public boolean isManual() { return sourceType == null && sourceId == null; }
}
