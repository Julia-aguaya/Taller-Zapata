package com.tallerzapata.backend.api.casefile;

import java.util.List;

public record CasePageResponse(
        List<CaseResponse> items,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
