package com.tallerzapata.backend.infrastructure.persistence.particularstate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "particular_effective_state")
public class ParticularEffectiveStateEntity {
    @Id
    @Column(name = "caso_id")
    private Long caseId;
    @Column(name = "tramite_codigo", nullable = false)
    private String procedureCode;
    @Column(name = "reparacion_codigo", nullable = false)
    private String repairCode;
    @Column(name = "tramite_terminal_override_codigo")
    private String procedureTerminalOverrideCode;
    @Column(name = "reparacion_terminal_override_codigo")
    private String repairTerminalOverrideCode;
    @Column(name = "outcome_origen_id")
    private Long sourceOutcomeId;
    @Column(name = "turno_reingreso_origen_id")
    private Long sourceReentryAppointmentId;
    @Column(name = "recalculated_at", nullable = false)
    private LocalDateTime recalculatedAt;

    public Long getCaseId() { return caseId; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public String getProcedureCode() { return procedureCode; }
    public void setProcedureCode(String procedureCode) { this.procedureCode = procedureCode; }
    public String getRepairCode() { return repairCode; }
    public void setRepairCode(String repairCode) { this.repairCode = repairCode; }
    public String getProcedureTerminalOverrideCode() { return procedureTerminalOverrideCode; }
    public void setProcedureTerminalOverrideCode(String procedureTerminalOverrideCode) { this.procedureTerminalOverrideCode = procedureTerminalOverrideCode; }
    public String getRepairTerminalOverrideCode() { return repairTerminalOverrideCode; }
    public void setRepairTerminalOverrideCode(String repairTerminalOverrideCode) { this.repairTerminalOverrideCode = repairTerminalOverrideCode; }
    public Long getSourceOutcomeId() { return sourceOutcomeId; }
    public void setSourceOutcomeId(Long sourceOutcomeId) { this.sourceOutcomeId = sourceOutcomeId; }
    public Long getSourceReentryAppointmentId() { return sourceReentryAppointmentId; }
    public void setSourceReentryAppointmentId(Long sourceReentryAppointmentId) { this.sourceReentryAppointmentId = sourceReentryAppointmentId; }
    public LocalDateTime getRecalculatedAt() { return recalculatedAt; }
    public void setRecalculatedAt(LocalDateTime recalculatedAt) { this.recalculatedAt = recalculatedAt; }
}
