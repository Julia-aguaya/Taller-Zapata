package com.tallerzapata.backend.api.document;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record DocumentResponse(
        Long id,
        String publicId,
        String fileName,
        String extension,
        String mimeType,
        Long sizeBytes,
        String checksumSha256,
        Long categoryId,
        String subcategoryCode,
        LocalDate documentDate,
        Long uploadedBy,
        String originCode,
        String observations,
        Long replacesDocumentId,
        Boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
