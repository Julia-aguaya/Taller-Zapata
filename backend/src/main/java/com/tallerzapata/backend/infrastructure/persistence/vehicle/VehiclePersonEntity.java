package com.tallerzapata.backend.infrastructure.persistence.vehicle;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "vehiculo_personas")
public class VehiclePersonEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehiculo_id", nullable = false)
    private Long vehicleId;

    @Column(name = "persona_id", nullable = false)
    private Long personId;

    @Column(name = "rol_vehiculo_codigo", nullable = false)
    private String rolVehiculoCodigo;

    @Column(name = "es_actual", nullable = false)
    private Boolean esActual;

    @Column(name = "desde")
    private LocalDate desde;

    @Column(name = "hasta")
    private LocalDate hasta;

    @Column(name = "notas")
    private String notas;

    @PrePersist
    void prePersist() {
        if (esActual == null) {
            esActual = true;
        }
    }

    public Long getId() { return id; }
    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }
    public Long getPersonId() { return personId; }
    public void setPersonId(Long personId) { this.personId = personId; }
    public String getRolVehiculoCodigo() { return rolVehiculoCodigo; }
    public void setRolVehiculoCodigo(String rolVehiculoCodigo) { this.rolVehiculoCodigo = rolVehiculoCodigo; }
    public Boolean getEsActual() { return esActual; }
    public void setEsActual(Boolean esActual) { this.esActual = esActual; }
    public LocalDate getDesde() { return desde; }
    public void setDesde(LocalDate desde) { this.desde = desde; }
    public LocalDate getHasta() { return hasta; }
    public void setHasta(LocalDate hasta) { this.hasta = hasta; }
    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }
}
