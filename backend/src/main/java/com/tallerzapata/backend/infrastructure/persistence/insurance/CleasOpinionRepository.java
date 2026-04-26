package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CleasOpinionRepository extends JpaRepository<CleasOpinionEntity, String> {
    boolean existsByCodeAndActiveTrue(String code);
}
