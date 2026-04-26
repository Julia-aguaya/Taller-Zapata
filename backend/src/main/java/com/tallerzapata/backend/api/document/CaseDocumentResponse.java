package com.tallerzapata.backend.api.document;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record CaseDocumentResponse(
        Long relationId,
        Long documentId,
        String publicId,
        String fileName,
        String mimeType,
        Long sizeBytes,
        Long categoryId,
        String entityType,
        Long entityId,
        String moduleCode,
        Boolean principal,
        Boolean visibleToCustomer,
        LocalDate documentDate,
        String originCode,
        LocalDateTime createdAt
) {
}
