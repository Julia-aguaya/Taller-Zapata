package com.tallerzapata.backend.api.extrabudget;

public record ExtraBudgetActivationRequest(Long expectedVersion, Boolean active, Boolean confirmDeactivation) {
}
