package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ThirdPartyDocumentationStatusRepository extends JpaRepository<ThirdPartyDocumentationStatusEntity, String> {
    boolean existsByCodeAndActiveTrue(String code);
}
