package com.tallerzapata.backend.infrastructure.persistence.provider;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProviderRepository extends JpaRepository<ProviderEntity, Long> {
    List<ProviderEntity> findByActiveTrueOrderByNameAsc();
    @Query("SELECT p FROM ProviderEntity p WHERE (:active IS NULL OR p.active = :active) AND (:q = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY p.name")
    List<ProviderEntity> search(@Param("q") String q, @Param("active") Boolean active);
}
