package com.tallerzapata.backend.api.extrabudget;

import java.math.BigDecimal;

public record ExtraBudgetComparisonRequest(Long expectedVersion, Long itemId, Long providerId, BigDecimal amount) {
}
