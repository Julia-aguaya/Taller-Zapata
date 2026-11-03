package com.tallerzapata.backend.application.operation;

import com.tallerzapata.backend.infrastructure.persistence.budget.CasePartEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.RepairPartReceiptEntity;
import com.tallerzapata.backend.infrastructure.persistence.operation.RepairPartReceiptRepository;
import org.springframework.stereotype.Service;

@Service
public class RepairPartReceiptAvailabilityService {
    private final RepairPartReceiptRepository receiptRepository;

    public RepairPartReceiptAvailabilityService(RepairPartReceiptRepository receiptRepository) {
        this.receiptRepository = receiptRepository;
    }

    public boolean isFullyReceived(CasePartEntity part) {
        return receivedQuantity(part.getId()) == orderedQuantity(part);
    }

    public int receivedQuantity(Long partId) {
        return receiptRepository.findByPartIdOrderByReceiptDateAscIdAsc(partId).stream()
                .mapToInt(RepairPartReceiptEntity::getQuantity)
                .sum();
    }

    public int orderedQuantity(CasePartEntity part) {
        return part.getOrderedQuantity() != null && part.getOrderedQuantity() > 0 ? part.getOrderedQuantity() : 1;
    }
}
