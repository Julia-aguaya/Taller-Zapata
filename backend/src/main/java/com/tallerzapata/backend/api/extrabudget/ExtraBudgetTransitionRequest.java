package com.tallerzapata.backend.api.extrabudget;

public record ExtraBudgetTransitionRequest(Long expectedVersion, String confirmation, String reason) {
}
