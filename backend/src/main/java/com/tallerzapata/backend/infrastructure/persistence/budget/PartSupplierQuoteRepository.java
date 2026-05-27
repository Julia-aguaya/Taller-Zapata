package com.tallerzapata.backend.infrastructure.persistence.budget;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PartSupplierQuoteRepository extends JpaRepository<PartSupplierQuoteEntity, Long> {
    List<PartSupplierQuoteEntity> findByPartIdOrderByIdAsc(Long partId);
    void deleteByPartId(Long partId);
}
