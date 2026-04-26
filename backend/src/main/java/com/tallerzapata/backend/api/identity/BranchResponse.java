package com.tallerzapata.backend.api.identity;

public record BranchResponse(
        Long id,
        String code,
        String name,
        Long organizationId
) {
}
