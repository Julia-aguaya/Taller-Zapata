package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CleasScopeRepository extends JpaRepository<CleasScopeEntity, String> {
    boolean existsByCodeAndActiveTrue(String code);
}
