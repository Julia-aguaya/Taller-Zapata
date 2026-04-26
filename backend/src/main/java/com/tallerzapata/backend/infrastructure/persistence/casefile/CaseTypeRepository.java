package com.tallerzapata.backend.infrastructure.persistence.casefile;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CaseTypeRepository extends JpaRepository<CaseTypeEntity, Long> {

    List<CaseTypeEntity> findByActiveTrueOrderByVisualOrderAscNameAsc();
}
