package com.tallerzapata.backend.api.casefile;

import java.time.LocalDateTime;

public record CaseAuditEventResponse(
        Long id,
        Long userId,
        Long caseId,
        String entityType,
        Long entityId,
        String actionCode,
        String domain,
        String beforeJson,
        String afterJson,
        String metadataJson,
        String sourceIp,
        String userAgent,
        LocalDateTime createdAt
) {
}
