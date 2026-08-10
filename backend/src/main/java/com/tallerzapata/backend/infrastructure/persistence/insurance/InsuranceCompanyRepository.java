package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InsuranceCompanyRepository extends JpaRepository<InsuranceCompanyEntity, Long> {
    boolean existsByCodeIgnoreCase(String code);
    List<InsuranceCompanyEntity> findByActiveTrueOrderByNameAsc();
    @Query("SELECT c FROM InsuranceCompanyEntity c WHERE (:active IS NULL OR c.active = :active) AND (:q = '' OR LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(c.code) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY c.name")
    List<InsuranceCompanyEntity> search(@Param("q") String q, @Param("active") Boolean active);
}
