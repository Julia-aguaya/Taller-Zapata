package com.tallerzapata.backend.infrastructure.persistence.budget;

import jakarta.persistence.*;

@Entity
@Table(name = "facturacion_cotizacion")
public class QuoteBillingEntity {
    @Id @Column(name = "codigo") private String code;
    @Column(name = "nombre", nullable = false) private String name;
    @Column(name = "activo", nullable = false) private Boolean active;

    public String getCode() { return code; }
    public String getName() { return name; }
    public Boolean getActive() { return active; }
}
