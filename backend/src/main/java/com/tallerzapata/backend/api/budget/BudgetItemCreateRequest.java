package com.tallerzapata.backend.api.budget;

import java.math.BigDecimal;

public record BudgetItemCreateRequest(
        Integer visualOrder,
        String affectedPiece,
        String taskCode,
        String damageLevelCode,
        String partDecisionCode,
        String actionCode,
        Boolean requiresReplacement,
        BigDecimal partValue,
        BigDecimal estimatedHours,
        BigDecimal laborAmount
) {
}
