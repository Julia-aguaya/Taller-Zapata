package com.tallerzapata.backend.api.insurance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record InsuranceCompanyContactCreateRequest(
        @NotNull Long personId,
        @NotBlank String contactRoleCode
) {
}
