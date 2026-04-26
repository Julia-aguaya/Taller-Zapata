package com.tallerzapata.backend.api.finance;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record IssuedReceiptResponse(
        Long id,
        String publicId,
        Long caseId,
        String receiptTypeCode,
        String receiptNumber,
        String receiverBusinessName,
        LocalDate issuedDate,
        BigDecimal taxableNet,
        BigDecimal vatAmount,
        BigDecimal total,
        LocalDateTime signedAt,
        String notes,
        Long documentId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
