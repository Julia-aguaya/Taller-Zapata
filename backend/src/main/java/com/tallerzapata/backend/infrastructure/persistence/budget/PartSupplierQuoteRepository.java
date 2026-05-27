package com.tallerzapata.backend.infrastructure.persistence.budget;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;

public interface PartSupplierQuoteRepository extends JpaRepository<PartSupplierQuoteEntity, Long> {
    List<PartSupplierQuoteEntity> findByPartIdOrderByIdAsc(Long partId);
    List<PartSupplierQuoteEntity> findByPartIdIn(Collection<Long> partIds);
}
