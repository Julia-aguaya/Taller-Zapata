package com.tallerzapata.backend.infrastructure.persistence.security;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "permisos")
public class PermissionEntity {

    @Id
    private Long id;

    @Column(name = "codigo", nullable = false)
    private String code;

    public Long getId() { return id; }
    public String getCode() { return code; }
}
