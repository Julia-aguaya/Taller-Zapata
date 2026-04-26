package com.tallerzapata.backend.infrastructure.persistence.insurance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LegalExpenseRepository extends JpaRepository<LegalExpenseEntity, Long> { List<LegalExpenseEntity> findByCaseLegalIdOrderByExpenseDateDesc(Long caseLegalId); }
