package com.tallerzapata.backend.api.budget;

import java.time.LocalDateTime;

public record CasePartReconciliationWarningResponse(
        Long id,
        Long partId,
        String sourceType,
        Long sourceId,
        String reason,
        String state,
        LocalDateTime createdAt
) {}
