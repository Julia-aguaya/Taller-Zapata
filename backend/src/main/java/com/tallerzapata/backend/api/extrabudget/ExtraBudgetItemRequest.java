package com.tallerzapata.backend.api.extrabudget;

import java.math.BigDecimal;

public record ExtraBudgetItemRequest(
        Integer visualOrder,
        String description,
        BigDecimal quantity,
        BigDecimal partUnitAmount,
        BigDecimal laborUnitAmount,
        String sourceType,
        Long sourceId,
        String affectedPiece,
        String taskCode,
        String actionCode,
        String damageLevelCode,
        BigDecimal partsAmount,
        Boolean active
) {
    public ExtraBudgetItemRequest(Integer visualOrder, String description, BigDecimal quantity,
                                  BigDecimal partUnitAmount, BigDecimal laborUnitAmount,
                                  String sourceType, Long sourceId) {
        this(visualOrder, description, quantity, partUnitAmount, laborUnitAmount, sourceType, sourceId,
                description, null, null, null, partUnitAmount, true);
    }
}
