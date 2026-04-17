package com.tallerzapata.backend.api.identity;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record UserRolesUpdateRequest(
        @NotNull @Valid List<UserRoleAssignmentRequest> assignments
) {
}
