package com.tallerzapata.backend.infrastructure.persistence.casefile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "caso_vehiculos")
public class CaseVehicleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "caso_id", nullable = false)
    private Long caseId;

    @Column(name = "vehiculo_id", nullable = false)
    private Long vehicleId;

    @Column(name = "rol_vehiculo_codigo", nullable = false)
    private String vehicleRoleCode;

    @Column(name = "es_principal", nullable = false)
    private Boolean principal;

    @Column(name = "orden_visual", nullable = false)
    private Integer visualOrder;

    @Column(name = "notas")
    private String notes;

    public Long getId() { return id; }
    public Long getCaseId() { return caseId; }
    public Long getVehicleId() { return vehicleId; }
    public String getVehicleRoleCode() { return vehicleRoleCode; }
    public Boolean getPrincipal() { return principal; }
    public Integer getVisualOrder() { return visualOrder; }
    public String getNotes() { return notes; }
    public void setCaseId(Long caseId) { this.caseId = caseId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }
    public void setVehicleRoleCode(String vehicleRoleCode) { this.vehicleRoleCode = vehicleRoleCode; }
    public void setPrincipal(Boolean principal) { this.principal = principal; }
    public void setVisualOrder(Integer visualOrder) { this.visualOrder = visualOrder; }
    public void setNotes(String notes) { this.notes = notes; }
}
