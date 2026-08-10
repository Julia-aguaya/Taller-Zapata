package com.tallerzapata.backend.infrastructure.persistence.todoriskstate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "todo_riesgo_effective_state")
public class TodoRiesgoEffectiveStateEntity {
    @Id @Column(name = "caso_id") private Long caseId;
    @Column(name = "tramite_codigo", nullable = false) private String procedureCode;
    @Column(name = "reparacion_codigo", nullable = false) private String repairCode;
    @Column(name = "reparacion_terminal_override_codigo") private String repairTerminalOverrideCode;
    @Column(name = "egreso_origen_id") private Long sourceOutcomeId;
    @Column(name = "turno_reingreso_origen_id") private Long sourceReentryAppointmentId;
    @Column(name = "recalculated_at", nullable = false) private LocalDateTime recalculatedAt;
    public Long getCaseId() { return caseId; } public void setCaseId(Long value) { caseId = value; }
    public String getProcedureCode() { return procedureCode; } public void setProcedureCode(String value) { procedureCode = value; }
    public String getRepairCode() { return repairCode; } public void setRepairCode(String value) { repairCode = value; }
    public String getRepairTerminalOverrideCode() { return repairTerminalOverrideCode; } public void setRepairTerminalOverrideCode(String value) { repairTerminalOverrideCode = value; }
    public Long getSourceOutcomeId() { return sourceOutcomeId; } public void setSourceOutcomeId(Long value) { sourceOutcomeId = value; }
    public Long getSourceReentryAppointmentId() { return sourceReentryAppointmentId; } public void setSourceReentryAppointmentId(Long value) { sourceReentryAppointmentId = value; }
    public LocalDateTime getRecalculatedAt() { return recalculatedAt; } public void setRecalculatedAt(LocalDateTime value) { recalculatedAt = value; }
}
