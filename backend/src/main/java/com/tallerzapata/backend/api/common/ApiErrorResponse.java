package com.tallerzapata.backend.api.common;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

public record ApiErrorResponse(
        OffsetDateTime timestamp,
        int status,
        String error,
        String message,
        String path,
        List<String> details,
        String code,
        Map<String, Object> data
) {
}
