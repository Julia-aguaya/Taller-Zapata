package com.tallerzapata.backend.infrastructure.persistence.workflow;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "workflow_estados")
public class WorkflowStateEntity {

    @Id
    private Long id;

    @Column(name = "codigo", nullable = false)
    private String code;

    @Column(name = "dominio", nullable = false)
    private String domain;

    @Column(name = "nombre", nullable = false)
    private String name;

    @Column(name = "terminal", nullable = false)
    private Boolean terminal;

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getDomain() { return domain; }
    public String getName() { return name; }
    public Boolean getTerminal() { return terminal; }
}
