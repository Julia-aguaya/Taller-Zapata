package com.tallerzapata.backend.infrastructure.persistence.operation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "prioridades_tarea")
public class TaskPriorityEntity {

    @Id
    @Column(name = "codigo", nullable = false)
    private String code;

    @Column(name = "nombre", nullable = false)
    private String name;

    @Column(name = "orden_visual", nullable = false)
    private Integer visualOrder;

    @Column(name = "activo", nullable = false)
    private Boolean active;

    public String getCode() { return code; }
    public String getName() { return name; }
    public Integer getVisualOrder() { return visualOrder; }
    public Boolean getActive() { return active; }
}
