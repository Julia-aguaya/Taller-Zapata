package com.tallerzapata.backend.api.reference;

public record ReferralContactResponse(
        Long id,
        String publicId,
        String name,
        String phone,
        String email,
        String notes,
        Boolean active
) {
}
