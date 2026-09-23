package com.tallerzapata.backend.infrastructure.persistence.cleasstate;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "cleas_state_facts")
public class CleasStateFactsEntity {
    @Id @Column(name = "caso_id") private Long caseId;
    @Column(name = "fecha_acuerdo") private LocalDate agreementDate;
    @Column(name = "no_repara_activo", nullable = false) private Boolean noRepairActive;
    @Column(name = "no_repara_motivo") private String noRepairReason;
    @Column(name = "no_repara_fecha") private LocalDateTime noRepairAt;
    @Column(name = "no_repara_actor_usuario_id") private Long noRepairActorUserId;
    @Column(name = "no_repara_revertido_fecha") private LocalDateTime noRepairRevertedAt;
    @Column(name = "no_repara_revertido_actor_usuario_id") private Long noRepairRevertedActorUserId;
    @Column(name = "no_repara_revertido_motivo") private String noRepairRevertedReason;
    @Column(name = "reparacion_urgente_activa", nullable = false) private Boolean urgentRepairActive;
    @Column(name = "reparacion_urgente_motivo") private String urgentRepairReason;
    @Column(name = "reparacion_urgente_fecha") private LocalDateTime urgentRepairAt;
    @Column(name = "reparacion_urgente_actor_usuario_id") private Long urgentRepairActorUserId;
    public Long getCaseId(){return caseId;} public void setCaseId(Long v){caseId=v;} public LocalDate getAgreementDate(){return agreementDate;} public void setAgreementDate(LocalDate v){agreementDate=v;}
    public Boolean getNoRepairActive(){return noRepairActive;} public void setNoRepairActive(Boolean v){noRepairActive=v;} public String getNoRepairReason(){return noRepairReason;} public void setNoRepairReason(String v){noRepairReason=v;} public LocalDateTime getNoRepairAt(){return noRepairAt;} public void setNoRepairAt(LocalDateTime v){noRepairAt=v;} public Long getNoRepairActorUserId(){return noRepairActorUserId;} public void setNoRepairActorUserId(Long v){noRepairActorUserId=v;}
    public LocalDateTime getNoRepairRevertedAt(){return noRepairRevertedAt;} public void setNoRepairRevertedAt(LocalDateTime v){noRepairRevertedAt=v;} public Long getNoRepairRevertedActorUserId(){return noRepairRevertedActorUserId;} public void setNoRepairRevertedActorUserId(Long v){noRepairRevertedActorUserId=v;} public String getNoRepairRevertedReason(){return noRepairRevertedReason;} public void setNoRepairRevertedReason(String v){noRepairRevertedReason=v;}
    public Boolean getUrgentRepairActive(){return urgentRepairActive;} public void setUrgentRepairActive(Boolean v){urgentRepairActive=v;} public String getUrgentRepairReason(){return urgentRepairReason;} public void setUrgentRepairReason(String v){urgentRepairReason=v;} public LocalDateTime getUrgentRepairAt(){return urgentRepairAt;} public void setUrgentRepairAt(LocalDateTime v){urgentRepairAt=v;} public Long getUrgentRepairActorUserId(){return urgentRepairActorUserId;} public void setUrgentRepairActorUserId(Long v){urgentRepairActorUserId=v;}
}
