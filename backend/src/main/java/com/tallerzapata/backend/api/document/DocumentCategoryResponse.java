package com.tallerzapata.backend.api.document;

public record DocumentCategoryResponse(
        Long id,
        String code,
        String name,
        String moduleCode,
        Long caseTypeId,
        Boolean requiresDate,
        Boolean visibleToCustomer
) {
}
