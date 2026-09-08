package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LegalLesionadoRepository extends JpaRepository<LegalLesionadoEntity, Long> {
    List<LegalLesionadoEntity> findByCaseLegalIdOrderByIdAsc(Long caseLegalId);
}
