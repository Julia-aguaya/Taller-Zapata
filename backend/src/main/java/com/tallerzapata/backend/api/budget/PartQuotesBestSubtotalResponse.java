package com.tallerzapata.backend.api.budget;

import java.math.BigDecimal;

public record PartQuotesBestSubtotalResponse(
    BigDecimal bestSubtotal,
    int partsWithQuotes,
    int partsWithoutQuotes
) {}
