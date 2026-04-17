package com.tallerzapata.backend.infrastructure.persistence.security;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface PermissionRepository extends JpaRepository<PermissionEntity, Long> {

    List<PermissionEntity> findByIdIn(Collection<Long> ids);

    List<PermissionEntity> findAllByOrderByCodeAsc();
}
