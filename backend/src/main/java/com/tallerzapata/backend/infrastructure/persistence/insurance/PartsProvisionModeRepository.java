package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PartsProvisionModeRepository extends JpaRepository<PartsProvisionModeEntity, String> {
    boolean existsByCodeAndActiveTrue(String code);
}
