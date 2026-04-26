package com.tallerzapata.backend.infrastructure.persistence.finance;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IssuedReceiptRepository extends JpaRepository<IssuedReceiptEntity, Long> {
    List<IssuedReceiptEntity> findByCaseId(Long caseId, Sort sort);
}
