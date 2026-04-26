package com.tallerzapata.backend.api.common;

import java.time.OffsetDateTime;
import java.util.List;

public record ApiErrorResponse(
        OffsetDateTime timestamp,
        int status,
        String error,
        String message,
        String path,
        List<String> details
) {
}
