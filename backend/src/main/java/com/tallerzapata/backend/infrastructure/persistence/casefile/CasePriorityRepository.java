package com.tallerzapata.backend.infrastructure.persistence.casefile;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CasePriorityRepository extends JpaRepository<CasePriorityEntity, String> {

    boolean existsByCodeAndActiveTrue(String code);

    List<CasePriorityEntity> findByActiveTrueOrderByVisualOrderAscNameAsc();
}
