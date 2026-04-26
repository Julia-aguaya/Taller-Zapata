package com.tallerzapata.backend.infrastructure.persistence.finance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IssuedReceiptTypeRepository extends JpaRepository<IssuedReceiptTypeEntity, String> {
    boolean existsByCodeAndActiveTrue(String code);
    List<IssuedReceiptTypeEntity> findByActiveTrueOrderByNameAsc();
}
