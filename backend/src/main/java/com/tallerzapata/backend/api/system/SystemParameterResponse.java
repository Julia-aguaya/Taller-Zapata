package com.tallerzapata.backend.api.system;

public record SystemParameterResponse(
        Long id,
        String code,
        String value,
        String dataTypeCode,
        String description,
        Boolean editable,
        Boolean visible,
        String moduleCode
) {
}
