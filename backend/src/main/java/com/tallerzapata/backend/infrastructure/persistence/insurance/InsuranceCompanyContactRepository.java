package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InsuranceCompanyContactRepository extends JpaRepository<InsuranceCompanyContactEntity, Long> {
    boolean existsByCompanyIdAndPersonIdAndContactRoleCode(Long companyId, Long personId, String contactRoleCode);
    List<InsuranceCompanyContactEntity> findByCompanyIdOrderByIdAsc(Long companyId);
}
