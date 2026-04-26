package com.tallerzapata.backend.api.document;

public record DocumentRelationUpdateRequest(
        Boolean principal,
        Boolean visibleToCustomer,
        Integer visualOrder
) {
}
