package com.tallerzapata.backend.api.operation;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;

public record RepairPartReceiptRequest(@NotNull @Positive Integer quantity, @NotNull LocalDate receiptDate) {
}
