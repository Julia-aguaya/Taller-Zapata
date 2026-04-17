package com.tallerzapata.backend.infrastructure.persistence.security;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoleRepository extends JpaRepository<RoleEntity, Long> {

    List<RoleEntity> findAllByActiveTrueOrderByCodeAsc();
}
