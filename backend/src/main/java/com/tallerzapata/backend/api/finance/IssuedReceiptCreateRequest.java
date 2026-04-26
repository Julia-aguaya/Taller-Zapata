package com.tallerzapata.backend.api.finance;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record IssuedReceiptCreateRequest(
        @NotBlank String receiptTypeCode,
        @NotBlank String receiptNumber,
        @NotBlank String receiverBusinessName,
        @NotNull LocalDate issuedDate,
        @NotNull @DecimalMin("0.00") BigDecimal taxableNet,
        @NotNull @DecimalMin("0.00") BigDecimal vatAmount,
        @NotNull @DecimalMin("0.00") BigDecimal total,
        LocalDateTime signedAt,
        String notes,
        Long documentId
) {
}
