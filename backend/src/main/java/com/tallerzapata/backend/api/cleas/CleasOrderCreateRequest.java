package com.tallerzapata.backend.api.cleas;

import jakarta.validation.constraints.NotNull;

public record CleasOrderCreateRequest(
        @NotNull Long documentId,
        Boolean principal,
        Boolean visibleToCustomer,
        Integer visualOrder
) {
}
