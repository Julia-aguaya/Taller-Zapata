package com.tallerzapata.backend.infrastructure.persistence.security;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "usuario_roles")
public class UserRoleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id", nullable = false)
    private Long userId;

    @Column(name = "rol_id", nullable = false)
    private Long roleId;

    @Column(name = "organizacion_id", nullable = false)
    private Long organizationId;

    @Column(name = "sucursal_id")
    private Long branchId;

    @Column(name = "activo", nullable = false)
    private Boolean active;

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Long getRoleId() { return roleId; }
    public Long getOrganizationId() { return organizationId; }
    public Long getBranchId() { return branchId; }
    public Boolean getActive() { return active; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setRoleId(Long roleId) { this.roleId = roleId; }
    public void setOrganizationId(Long organizationId) { this.organizationId = organizationId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public void setActive(Boolean active) { this.active = active; }
}
