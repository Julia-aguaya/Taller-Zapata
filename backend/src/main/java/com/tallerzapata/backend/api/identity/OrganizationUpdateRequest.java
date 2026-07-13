package com.tallerzapata.backend.api.identity;

public record OrganizationUpdateRequest(
        String name,
        String razonSocial,
        String cuit,
        String condicionIva,
        String phone,
        String email,
        Long logoDocumentId
) {
}
