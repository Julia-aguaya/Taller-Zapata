package com.tallerzapata.backend.api.insurance;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record ThirdPartyWorkshopRetentionRequest(Long expectedVersion, @NotNull List<@Valid Item> retentions) {
    public record Item(@NotNull String retentionTypeCode, @NotNull java.math.BigDecimal amount, String detail) { }
}
