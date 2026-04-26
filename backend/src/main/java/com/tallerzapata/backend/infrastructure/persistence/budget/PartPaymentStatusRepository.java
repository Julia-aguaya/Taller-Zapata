package com.tallerzapata.backend.infrastructure.persistence.budget;

import org.springframework.data.jpa.repository.JpaRepository;
public interface PartPaymentStatusRepository extends JpaRepository<PartPaymentStatusEntity, String> { boolean existsByCodeAndActiveTrue(String code); }
