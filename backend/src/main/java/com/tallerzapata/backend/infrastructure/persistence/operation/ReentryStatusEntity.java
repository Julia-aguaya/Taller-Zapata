package com.tallerzapata.backend.infrastructure.persistence.operation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "estados_reingreso")
public class ReentryStatusEntity {

    @Id
    @Column(name = "codigo", nullable = false)
    private String code;

    @Column(name = "nombre", nullable = false)
    private String name;

    @Column(name = "activo", nullable = false)
    private Boolean active;

    public String getCode() { return code; }
    public String getName() { return name; }
    public Boolean getActive() { return active; }
}
