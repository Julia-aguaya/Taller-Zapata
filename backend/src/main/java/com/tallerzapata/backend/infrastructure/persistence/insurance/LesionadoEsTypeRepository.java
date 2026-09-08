package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LesionadoEsTypeRepository extends JpaRepository<LesionadoEsTypeEntity, String> {
    boolean existsByCodeAndActiveTrue(String code);
}
