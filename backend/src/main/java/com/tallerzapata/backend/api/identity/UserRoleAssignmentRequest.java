package com.tallerzapata.backend.api.identity;

import jakarta.validation.constraints.NotNull;

public record UserRoleAssignmentRequest(
        @NotNull Long roleId,
        @NotNull Long organizationId,
        Long branchId,
        Boolean active
) {
}
