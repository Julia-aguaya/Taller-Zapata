package com.tallerzapata.backend.api.identity;

public record UserRoleAssignmentResponse(
        Long roleId,
        String roleCode,
        Long organizationId,
        Long branchId,
        boolean active
) {
}
