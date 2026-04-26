package com.tallerzapata.backend.api.insurance;

public record InsuranceCompanyResponse(
        Long id,
        String publicId,
        String code,
        String name,
        String taxId,
        Boolean requiresRepairPhotos,
        Integer expectedPaymentDays,
        Boolean active
) {
}
