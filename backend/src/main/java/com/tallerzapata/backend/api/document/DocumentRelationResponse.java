package com.tallerzapata.backend.api.document;

public record DocumentRelationResponse(
        Long id,
        Long documentId,
        Long caseId,
        String entityType,
        Long entityId,
        String moduleCode,
        Boolean principal,
        Boolean visibleToCustomer,
        Integer visualOrder
) {
}
