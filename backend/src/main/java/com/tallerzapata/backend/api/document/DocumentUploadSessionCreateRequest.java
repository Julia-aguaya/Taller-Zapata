package com.tallerzapata.backend.api.document;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record DocumentUploadSessionCreateRequest(
        Long caseId, @NotNull Long categoryId, @NotBlank String fileName, @NotBlank String mimeType,
        @Min(1) long sizeBytes, @NotBlank String checksumSha256, @Min(1) int chunkCount, String originCode, String observations, LocalDate documentDate
) { }
