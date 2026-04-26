package com.tallerzapata.backend.infrastructure.persistence.system;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SystemParameterRepository extends JpaRepository<SystemParameterEntity, Long> {
    Optional<SystemParameterEntity> findByCode(String code);
    List<SystemParameterEntity> findByModuleCodeAndVisibleTrue(String moduleCode);
    boolean existsByCode(String code);
}
