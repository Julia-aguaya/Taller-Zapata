package com.tallerzapata.backend.api.reference;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ReferralContactUpsertRequest(
        @NotBlank String name,
        String phone,
        @Email String email,
        String notes,
        Boolean active
) {
}
