package com.tallerzapata.backend.api.cleas;

import java.time.LocalDate;

public record CleasOrderResponse(
        Long relationId,
        Long documentId,
        String publicId,
        String fileName,
        String mimeType,
        LocalDate documentDate,
        Boolean principal,
        Boolean visibleToCustomer,
        Integer visualOrder
) {
}
