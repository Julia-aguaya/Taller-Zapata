package com.tallerzapata.backend.api.budget;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PartSupplierQuoteCreateRequest(
    @NotBlank String supplier,
    @NotNull BigDecimal amount,
    @NotBlank String billingCode,
    @NotBlank String paymentMethodCode
) {}
