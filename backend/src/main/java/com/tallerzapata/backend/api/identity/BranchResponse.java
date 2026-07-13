package com.tallerzapata.backend.api.identity;

public record BranchResponse(
        Long id,
        String code,
        String name,
        Long organizationId,
        String addressLine1,
        String city,
        String province,
        String phone,
        String email
) {
}
