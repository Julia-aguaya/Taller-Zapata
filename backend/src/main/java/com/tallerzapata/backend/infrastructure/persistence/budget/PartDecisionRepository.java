package com.tallerzapata.backend.infrastructure.persistence.budget;

import org.springframework.data.jpa.repository.JpaRepository;
public interface PartDecisionRepository extends JpaRepository<PartDecisionEntity, String> { boolean existsByCodeAndActiveTrue(String code); }
