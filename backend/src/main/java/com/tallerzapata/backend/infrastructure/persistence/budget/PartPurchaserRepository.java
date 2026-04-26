package com.tallerzapata.backend.infrastructure.persistence.budget;

import org.springframework.data.jpa.repository.JpaRepository;
public interface PartPurchaserRepository extends JpaRepository<PartPurchaserEntity, String> { boolean existsByCodeAndActiveTrue(String code); }
