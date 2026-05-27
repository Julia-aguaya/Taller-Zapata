package com.tallerzapata.backend.infrastructure.persistence.budget;

import org.springframework.data.jpa.repository.JpaRepository;

public interface QuotePaymentMethodRepository extends JpaRepository<QuotePaymentMethodEntity, String> {
    boolean existsByCodeAndActiveTrue(String code);
}
