package com.tallerzapata.backend.api.identity;

public record OrganizationUpdateRequest(
        String name,
        String razonSocial,
        String phone,
        String email
) {
}
