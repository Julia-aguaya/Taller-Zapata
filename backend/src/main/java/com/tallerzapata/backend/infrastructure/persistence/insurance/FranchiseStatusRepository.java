package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;
public interface FranchiseStatusRepository extends JpaRepository<FranchiseStatusEntity, String> { boolean existsByCodeAndActiveTrue(String code); }
