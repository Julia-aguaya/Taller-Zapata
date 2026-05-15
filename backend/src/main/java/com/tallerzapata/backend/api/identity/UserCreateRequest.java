package com.tallerzapata.backend.api.identity;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserCreateRequest(
        @NotBlank String username,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8) String password,
        @NotBlank String firstName,
        String lastName,
        Boolean active,
        @NotNull Long roleId,
        @NotNull Long organizationId,
        Long branchId
) {
}
