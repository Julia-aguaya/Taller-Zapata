package com.tallerzapata.backend.api.identity;

public record OrganizationResponse(
        Long id,
        String publicId,
        String code,
        String name,
        String razonSocial,
        String cuit,
        String condicionIva,
        String phone,
        String email,
        Long logoDocumentId
) {
}
