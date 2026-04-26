package com.tallerzapata.backend.api.identity;

public record OrganizationResponse(
        Long id,
        String publicId,
        String code,
        String name
) {
}
