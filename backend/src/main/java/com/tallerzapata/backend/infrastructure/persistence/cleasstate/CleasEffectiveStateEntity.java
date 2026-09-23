package com.tallerzapata.backend.infrastructure.persistence.cleasstate;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity @Table(name = "cleas_effective_state")
public class CleasEffectiveStateEntity {
  @Id @Column(name="caso_id") private Long caseId; @Column(name="tramite_codigo",nullable=false) private String procedureCode; @Column(name="reparacion_codigo",nullable=false) private String repairCode; @Column(name="tramite_terminal_override_codigo") private String procedureTerminalOverrideCode; @Column(name="reparacion_terminal_override_codigo") private String repairTerminalOverrideCode; @Column(name="recalculated_at",nullable=false) private LocalDateTime recalculatedAt;
  public Long getCaseId(){return caseId;} public void setCaseId(Long v){caseId=v;} public String getProcedureCode(){return procedureCode;} public void setProcedureCode(String v){procedureCode=v;} public String getRepairCode(){return repairCode;} public void setRepairCode(String v){repairCode=v;} public String getProcedureTerminalOverrideCode(){return procedureTerminalOverrideCode;} public void setProcedureTerminalOverrideCode(String v){procedureTerminalOverrideCode=v;} public String getRepairTerminalOverrideCode(){return repairTerminalOverrideCode;} public void setRepairTerminalOverrideCode(String v){repairTerminalOverrideCode=v;} public LocalDateTime getRecalculatedAt(){return recalculatedAt;} public void setRecalculatedAt(LocalDateTime v){recalculatedAt=v;}
}
