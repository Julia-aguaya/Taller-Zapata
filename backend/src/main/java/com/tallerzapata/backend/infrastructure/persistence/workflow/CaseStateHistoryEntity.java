package com.tallerzapata.backend.infrastructure.persistence.workflow;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "caso_estado_historial")
public class CaseStateHistoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "caso_id", nullable = false)
    private Long caseId;

    @Column(name = "dominio_estado", nullable = false)
    private String stateDomain;

    @Column(name = "estado_id", nullable = false)
    private Long stateId;

    @Column(name = "fecha_estado", nullable = false)
    private LocalDateTime stateDate;

    @Column(name = "usuario_id")
    private Long userId;

    @Column(name = "automatico", nullable = false)
    private Boolean automatic;

    private String motivo;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "detalle_json")
    private String detailJson;

    public Long getId() { return id; }
    public Long getCaseId() { return caseId; }
    public String getStateDomain() { return stateDomain; }
    public Long getStateId() { return stateId; }
    public LocalDateTime getStateDate() { return stateDate; }
    public Long getUserId() { return userId; }
    public Boolean getAutomatic() { return automatic; }
    public String getMotivo() { return motivo; }
    public String getDetailJson() { return detailJson; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public void setStateDomain(String stateDomain) { this.stateDomain = stateDomain; }
    public void setStateId(Long stateId) { this.stateId = stateId; }
    public void setStateDate(LocalDateTime stateDate) { this.stateDate = stateDate; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setAutomatic(Boolean automatic) { this.automatic = automatic; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
    public void setDetailJson(String detailJson) { this.detailJson = detailJson; }
}
