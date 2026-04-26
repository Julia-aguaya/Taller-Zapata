package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InsuranceCompanyRepository extends JpaRepository<InsuranceCompanyEntity, Long> {
    boolean existsByCodeIgnoreCase(String code);
    List<InsuranceCompanyEntity> findByActiveTrueOrderByNameAsc();
}
