package com.tallerzapata.backend.api.operation;

import java.util.List;

public record OperationalTaskPageResponse(
        List<OperationalTaskResponse> items,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
