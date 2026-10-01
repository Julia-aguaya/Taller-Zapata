package com.tallerzapata.backend.api.insurance;

import jakarta.validation.constraints.NotBlank;

public record ThirdPartyWorkshopContactRequest(
        @NotBlank String name,
        String lastName,
        String email,
        String phone
) {
}
