package com.tallerzapata.backend.infrastructure.persistence.budget;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuotePaymentMethodRepository extends JpaRepository<QuotePaymentMethodEntity, String> {
    boolean existsByCodeAndActiveTrue(String code);
    List<QuotePaymentMethodEntity> findByActiveTrueOrderByCodeAsc();
}
