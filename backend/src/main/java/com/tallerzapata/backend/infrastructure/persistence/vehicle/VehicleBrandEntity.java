package com.tallerzapata.backend.infrastructure.persistence.vehicle;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "marcas_vehiculo")
public class VehicleBrandEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo", nullable = false)
    private String codigo;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    @Column(name = "activo", nullable = false)
    private Boolean activo;

    public Long getId() { return id; }
    public String getCodigo() { return codigo; }
    public String getNombre() { return nombre; }
    public Boolean getActivo() { return activo; }
}
