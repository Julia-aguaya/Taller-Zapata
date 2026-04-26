package com.tallerzapata.backend.infrastructure.persistence.casefile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "caso_personas")
public class CasePersonEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "caso_id", nullable = false)
    private Long caseId;

    @Column(name = "persona_id", nullable = false)
    private Long personId;

    @Column(name = "rol_caso_codigo", nullable = false)
    private String caseRoleCode;

    @Column(name = "vehiculo_id")
    private Long vehicleId;

    @Column(name = "es_principal", nullable = false)
    private Boolean principal;

    private String notas;

    public Long getId() { return id; }
    public Long getCaseId() { return caseId; }
    public Long getPersonId() { return personId; }
    public String getCaseRoleCode() { return caseRoleCode; }
    public Long getVehicleId() { return vehicleId; }
    public Boolean getPrincipal() { return principal; }
    public String getNotas() { return notas; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public void setPersonId(Long personId) { this.personId = personId; }
    public void setCaseRoleCode(String caseRoleCode) { this.caseRoleCode = caseRoleCode; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }
    public void setPrincipal(Boolean principal) { this.principal = principal; }
    public void setNotas(String notas) { this.notas = notas; }
}
