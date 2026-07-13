package com.tallerzapata.backend.api.identity;

public record BranchUpdateRequest(
        String name,
        String addressLine1,
        String city,
        String province,
        String phone,
        String email
) {
}
