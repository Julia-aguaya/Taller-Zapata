package com.tallerzapata.backend.api.document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DocumentRelationCreateRequest(
        @NotNull Long caseId,
        @NotBlank String entityType,
        @NotNull Long entityId,
        @NotBlank String moduleCode,
        Boolean principal,
        Boolean visibleToCustomer,
        Integer visualOrder
) {
}
