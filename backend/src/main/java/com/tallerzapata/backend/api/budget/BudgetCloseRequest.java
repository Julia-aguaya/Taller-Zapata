package com.tallerzapata.backend.api.budget;

public record BudgetCloseRequest(
        String reportStatusCode,
        String observations
) {
}
