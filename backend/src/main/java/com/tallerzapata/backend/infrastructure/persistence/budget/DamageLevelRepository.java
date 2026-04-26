package com.tallerzapata.backend.infrastructure.persistence.budget;

import org.springframework.data.jpa.repository.JpaRepository;
public interface DamageLevelRepository extends JpaRepository<DamageLevelEntity, String> { boolean existsByCodeAndActiveTrue(String code); }
