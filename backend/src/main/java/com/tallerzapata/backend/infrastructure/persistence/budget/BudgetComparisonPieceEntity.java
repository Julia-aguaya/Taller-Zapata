package com.tallerzapata.backend.infrastructure.persistence.budget;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "comparacion_pieza")
public class BudgetComparisonPieceEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "snapshot_id", nullable = false, updatable = false) private Long snapshotId;
    @Column(name = "contexto", nullable = false, updatable = false) private String context;
    @Column(name = "presupuesto_item_origen_id", updatable = false) private Long sourceBudgetItemId;
    @Column(name = "presupuesto_extra_item_origen_id", updatable = false) private Long sourceExtraBudgetItemId;
    @Column(name = "descripcion", nullable = false, updatable = false) private String description;
    @Column(name = "accion_codigo", updatable = false) private String actionCode;
    @Column(name = "valor_repuesto_fuente", nullable = false, updatable = false) private BigDecimal sourcePartValue;
    @Column(name = "origen", nullable = false, updatable = false) private String origin;
    @Column(name = "transferred_part_id") private Long transferredPartId;
    public Long getId() { return id; } public Long getSnapshotId() { return snapshotId; } public void setSnapshotId(Long value) { snapshotId = value; }
    public String getContext() { return context; } public void setContext(String value) { context = value; }
    public Long getSourceBudgetItemId() { return sourceBudgetItemId; } public void setSourceBudgetItemId(Long value) { sourceBudgetItemId = value; }
    public Long getSourceExtraBudgetItemId() { return sourceExtraBudgetItemId; } public void setSourceExtraBudgetItemId(Long value) { sourceExtraBudgetItemId = value; }
    public String getDescription() { return description; } public void setDescription(String value) { description = value; }
    public String getActionCode() { return actionCode; } public void setActionCode(String value) { actionCode = value; }
    public BigDecimal getSourcePartValue() { return sourcePartValue; } public void setSourcePartValue(BigDecimal value) { sourcePartValue = value; }
    public String getOrigin() { return origin; } public void setOrigin(String value) { origin = value; }
    public Long getTransferredPartId() { return transferredPartId; } public void setTransferredPartId(Long value) { transferredPartId = value; }
}
