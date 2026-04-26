package com.tallerzapata.backend.api.system;

import jakarta.validation.constraints.NotBlank;

public record SystemParameterUpsertRequest(
        @NotBlank String code,
        @NotBlank String value,
        @NotBlank String dataTypeCode,
        String description,
        Boolean editable,
        Boolean visible,
        String moduleCode
) {
}
