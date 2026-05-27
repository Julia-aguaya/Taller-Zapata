package com.tallerzapata.backend.api.budget;

import java.math.BigDecimal;

public record PartSupplierQuoteResponse(
    Long id,
    Long partId,
    String supplier,
    BigDecimal amount,
    String billingCode,
    String paymentMethodCode
) {}
