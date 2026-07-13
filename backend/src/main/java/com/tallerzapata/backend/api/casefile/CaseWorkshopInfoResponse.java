package com.tallerzapata.backend.api.casefile;

public record CaseWorkshopInfoResponse(
        String organizationName,
        String razonSocial,
        String cuit,
        String condicionIva,
        String branchCode,
        String branchName,
        String addressLine1,
        String city,
        String province,
        String phone,
        String email
) {
}
