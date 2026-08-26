package com.tallerzapata.backend.infrastructure.persistence.budget;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "comparacion_presupuesto_snapshot")
public class BudgetComparisonSnapshotEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "caso_id", nullable = false, updatable = false) private Long caseId;
    @Column(name = "contexto", nullable = false, updatable = false) private String context;
    @Column(name = "presupuesto_id", updatable = false) private Long budgetId;
    @Column(name = "presupuesto_extra_version_id", updatable = false) private Long extraBudgetVersionId;
    @Column(name = "generacion", nullable = false, updatable = false) private Integer generation;
    @Column(name = "fecha_presupuesto", updatable = false) private LocalDate budgetDate;
    @Column(name = "version_presupuesto", updatable = false) private Integer budgetVersion;
    @Column(name = "idempotency_key", nullable = false, updatable = false) private String idempotencyKey;
    @Column(name = "modo", nullable = false) private String mode;
    public Long getId() { return id; } public Long getCaseId() { return caseId; } public void setCaseId(Long value) { caseId = value; }
    public String getContext() { return context; } public void setContext(String value) { context = value; }
    public Long getBudgetId() { return budgetId; } public void setBudgetId(Long value) { budgetId = value; }
    public Long getExtraBudgetVersionId() { return extraBudgetVersionId; } public void setExtraBudgetVersionId(Long value) { extraBudgetVersionId = value; }
    public Integer getGeneration() { return generation; } public void setGeneration(Integer value) { generation = value; }
    public LocalDate getBudgetDate() { return budgetDate; } public void setBudgetDate(LocalDate value) { budgetDate = value; }
    public Integer getBudgetVersion() { return budgetVersion; } public void setBudgetVersion(Integer value) { budgetVersion = value; }
    public String getIdempotencyKey() { return idempotencyKey; } public void setIdempotencyKey(String value) { idempotencyKey = value; }
    public String getMode() { return mode; } public void setMode(String value) { mode = value; }
}
