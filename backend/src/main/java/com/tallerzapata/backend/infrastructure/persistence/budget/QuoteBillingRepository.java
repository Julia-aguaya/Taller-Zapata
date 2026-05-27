package com.tallerzapata.backend.infrastructure.persistence.budget;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuoteBillingRepository extends JpaRepository<QuoteBillingEntity, String> {
    boolean existsByCodeAndActiveTrue(String code);
    List<QuoteBillingEntity> findByActiveTrueOrderByCodeAsc();
}
