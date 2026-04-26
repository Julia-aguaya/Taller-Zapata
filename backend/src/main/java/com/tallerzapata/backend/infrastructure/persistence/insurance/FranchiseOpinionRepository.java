package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;
public interface FranchiseOpinionRepository extends JpaRepository<FranchiseOpinionEntity, String> { boolean existsByCodeAndActiveTrue(String code); }
