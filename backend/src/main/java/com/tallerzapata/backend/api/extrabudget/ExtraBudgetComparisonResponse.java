package com.tallerzapata.backend.api.extrabudget;

import java.math.BigDecimal;
import java.util.List;

public record ExtraBudgetComparisonResponse(Long itemId, Long pieceId, String description, BigDecimal selectedAmount,
                                            Long selectedProviderId, List<Quote> quotes) {
    public record Quote(Long id, Long providerId, String providerName, BigDecimal amount, boolean selected, boolean best) {
    }
}
