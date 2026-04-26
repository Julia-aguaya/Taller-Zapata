package com.tallerzapata.backend.infrastructure.persistence.operation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "estados_tarea")
public class TaskStatusEntity {

    @Id
    @Column(name = "codigo", nullable = false)
    private String code;

    @Column(name = "nombre", nullable = false)
    private String name;

    @Column(name = "terminal", nullable = false)
    private Boolean terminal;

    @Column(name = "activo", nullable = false)
    private Boolean active;

    public String getCode() { return code; }
    public String getName() { return name; }
    public Boolean getTerminal() { return terminal; }
    public Boolean getActive() { return active; }
}
