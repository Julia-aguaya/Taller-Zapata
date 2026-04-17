package com.tallerzapata.backend.infrastructure.persistence.security;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "rol_permisos")
public class RolePermissionEntity {

    @Id
    private Long id;

    @Column(name = "rol_id", nullable = false)
    private Long roleId;

    @Column(name = "permiso_id", nullable = false)
    private Long permissionId;

    @Column(name = "allow_flag", nullable = false)
    private Boolean allowFlag;

    public Long getId() { return id; }
    public Long getRoleId() { return roleId; }
    public Long getPermissionId() { return permissionId; }
    public Boolean getAllowFlag() { return allowFlag; }
}
