package com.tallerzapata.backend.api.extrabudget;

import java.math.BigDecimal;
import java.util.List;

public record ExtraBudgetDraftRequest(Long expectedVersion, List<ExtraBudgetItemRequest> items,
                                      BigDecimal generalLaborAmount, Boolean generalLaborVatApplies, String notes) {
    public ExtraBudgetDraftRequest(Long expectedVersion, List<ExtraBudgetItemRequest> items) {
        this(expectedVersion, items, BigDecimal.ZERO, true, null);
    }
}
