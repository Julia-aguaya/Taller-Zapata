package com.tallerzapata.backend.infrastructure.persistence.organization;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ReferenciadorRepository extends JpaRepository<ReferenciadorEntity, Long> {
    List<ReferenciadorEntity> findByActivoTrueOrderByNombreAsc();
    @Query("SELECT r FROM ReferenciadorEntity r WHERE r.activo = true AND (LOWER(r.nombre) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(r.apellido) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY r.nombre")
    List<ReferenciadorEntity> search(@Param("q") String q);
}
