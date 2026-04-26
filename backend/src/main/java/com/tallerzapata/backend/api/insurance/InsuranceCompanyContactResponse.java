package com.tallerzapata.backend.api.insurance;

public record InsuranceCompanyContactResponse(
        Long id,
        Long companyId,
        Long personId,
        String contactRoleCode
) {
}
