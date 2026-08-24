package com.tallerzapata.backend.api.budget;

import java.math.BigDecimal;

public record BudgetAccessoryWorkResponse(
        Long id,
        String affectedPiece,
        String actionCode,
        String damageLevelCode,
        BigDecimal replacementAmount,
        Boolean active
) {
    public BudgetAccessoryWorkResponse(Long id, String affectedPiece, String actionCode, String damageLevelCode, BigDecimal replacementAmount) {
        this(id, affectedPiece, actionCode, damageLevelCode, replacementAmount, true);
    }
}
