package com.tallerzapata.backend.infrastructure.persistence.budget;

import org.springframework.data.jpa.repository.JpaRepository;
public interface PartStatusRepository extends JpaRepository<PartStatusEntity, String> { boolean existsByCodeAndActiveTrue(String code); }
