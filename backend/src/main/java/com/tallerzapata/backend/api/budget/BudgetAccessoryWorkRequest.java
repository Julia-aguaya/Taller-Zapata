package com.tallerzapata.backend.api.budget;

import java.math.BigDecimal;

public record BudgetAccessoryWorkRequest(
        Long id,
        String affectedPiece,
        String actionCode,
        String damageLevelCode,
        BigDecimal replacementAmount
) {
    public BudgetAccessoryWorkRequest(String affectedPiece, String actionCode, String damageLevelCode, BigDecimal replacementAmount) {
        this(null, affectedPiece, actionCode, damageLevelCode, replacementAmount);
    }
}
