package com.tallerzapata.backend.api.budget;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record PartSupplierQuoteCreateRequest(
    @NotBlank @Size(max = 150) String supplier,
    @NotNull @Positive BigDecimal amount,
    @NotBlank @Size(max = 40) String billingCode,
    @NotBlank @Size(max = 40) String paymentMethodCode
) {}
