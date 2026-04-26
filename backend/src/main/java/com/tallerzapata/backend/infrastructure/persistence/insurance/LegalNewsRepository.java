package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LegalNewsRepository extends JpaRepository<LegalNewsEntity, Long> { List<LegalNewsEntity> findByCaseLegalIdOrderByNewsDateDesc(Long caseLegalId); }
