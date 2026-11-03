package com.tallerzapata.backend.infrastructure.persistence.operation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface RepairPartReceiptRepository extends JpaRepository<RepairPartReceiptEntity, Long> {
    @Query("""
            select receipt from RepairPartReceiptEntity receipt
            where receipt.partId = :partId
            order by case when receipt.receiptDate is null then 1 else 0 end, receipt.receiptDate asc, receipt.id asc
            """)
    List<RepairPartReceiptEntity> findByPartIdOrderByReceiptDateAscIdAsc(@Param("partId") Long partId);
    Optional<RepairPartReceiptEntity> findByIdAndPartId(Long id, Long partId);
}
