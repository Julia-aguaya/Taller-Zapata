package com.tallerzapata.backend.infrastructure.persistence.casefile;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CaseTypeRepository extends JpaRepository<CaseTypeEntity, Long> {

    List<CaseTypeEntity> findByActiveTrueOrderByVisualOrderAscNameAsc();

    Optional<CaseTypeEntity> findByCode(String code);
}
