package com.tallerzapata.backend.infrastructure.persistence.system;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ParameterDataTypeRepository extends JpaRepository<ParameterDataTypeEntity, String> {
    boolean existsByCodeAndActiveTrue(String code);
}
