package com.tallerzapata.backend.infrastructure.persistence.organization;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "sucursales")
public class BranchEntity {

    @Id
    private Long id;

    @Column(name = "organizacion_id", nullable = false)
    private Long organizationId;

    @Column(name = "codigo", nullable = false)
    private String code;

    @Column(name = "nombre", nullable = false)
    private String name;

    public Long getId() { return id; }
    public Long getOrganizationId() { return organizationId; }
    public String getCode() { return code; }
    public String getName() { return name; }
}
