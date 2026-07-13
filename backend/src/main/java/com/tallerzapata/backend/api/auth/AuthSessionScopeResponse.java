package com.tallerzapata.backend.api.auth;

public record AuthSessionScopeResponse(
        Long organizationId,
        Long branchId,
        String branchCode,
        String branchName
) {
}
