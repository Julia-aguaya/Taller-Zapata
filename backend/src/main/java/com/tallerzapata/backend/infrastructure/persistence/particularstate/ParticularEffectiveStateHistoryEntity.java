package com.tallerzapata.backend.infrastructure.persistence.particularstate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "particular_effective_state_history")
public class ParticularEffectiveStateHistoryEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "caso_id", nullable = false) private Long caseId;
    @Column(name = "prior_tramite_codigo") private String priorProcedureCode;
    @Column(name = "new_tramite_codigo", nullable = false) private String newProcedureCode;
    @Column(name = "prior_reparacion_codigo") private String priorRepairCode;
    @Column(name = "new_reparacion_codigo", nullable = false) private String newRepairCode;
    @Column(name = "change_scope", nullable = false) private String changeScope;
    @Column(name = "cause", nullable = false) private String cause;
    @Column(name = "actor_usuario_id") private Long actorUserId;
    @Column(name = "reason") private String reason;
    @Column(name = "override_dimension") private String overrideDimension;
    @Column(name = "override_prior_codigo") private String overridePriorCode;
    @Column(name = "override_new_codigo") private String overrideNewCode;
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;
    public void setCaseId(Long value) { caseId = value; } public void setPriorProcedureCode(String value) { priorProcedureCode = value; } public void setNewProcedureCode(String value) { newProcedureCode = value; } public void setPriorRepairCode(String value) { priorRepairCode = value; } public void setNewRepairCode(String value) { newRepairCode = value; } public void setChangeScope(String value) { changeScope = value; } public void setCause(String value) { cause = value; } public void setActorUserId(Long value) { actorUserId = value; } public void setReason(String value) { reason = value; } public void setOverrideDimension(String value) { overrideDimension = value; } public void setOverridePriorCode(String value) { overridePriorCode = value; } public void setOverrideNewCode(String value) { overrideNewCode = value; } public void setCreatedAt(LocalDateTime value) { createdAt = value; }
}
