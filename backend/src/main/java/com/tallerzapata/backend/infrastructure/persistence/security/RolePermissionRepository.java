package com.tallerzapata.backend.infrastructure.persistence.security;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface RolePermissionRepository extends JpaRepository<RolePermissionEntity, Long> {

    List<RolePermissionEntity> findByRoleIdInAndAllowFlagTrue(Collection<Long> roleIds);
}
