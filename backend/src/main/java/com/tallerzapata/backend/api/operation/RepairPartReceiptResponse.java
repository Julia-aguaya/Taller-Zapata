package com.tallerzapata.backend.api.operation;

import java.time.LocalDate;

public record RepairPartReceiptResponse(Long id, Integer quantity, LocalDate receiptDate) {
}
