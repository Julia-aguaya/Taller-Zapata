package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;

public interface InsuranceRoleContactRepository extends JpaRepository<InsuranceRoleContactEntity, String> {
    boolean existsByCodeAndActiveTrue(String code);
}
