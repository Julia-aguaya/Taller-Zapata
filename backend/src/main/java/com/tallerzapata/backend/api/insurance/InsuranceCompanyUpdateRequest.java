package com.tallerzapata.backend.api.insurance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

public record InsuranceCompanyUpdateRequest(@NotBlank String code, @NotBlank String name, String taxId, Boolean requiresRepairPhotos, @PositiveOrZero Integer expectedPaymentDays) {}
