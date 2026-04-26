package com.tallerzapata.backend.infrastructure.persistence.casefile;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CaseRoleRepository extends JpaRepository<CaseRoleEntity, String> {

    boolean existsByCodeAndActiveTrue(String code);

    List<CaseRoleEntity> findByActiveTrueOrderByNameAsc();
}
