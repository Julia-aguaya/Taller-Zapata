package com.tallerzapata.backend.api.document;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record DocumentUpdateRequest(
        @NotNull Long categoryId,
        String subcategoryCode,
        LocalDate documentDate,
        String originCode,
        String observations,
        Boolean active
) {
}
