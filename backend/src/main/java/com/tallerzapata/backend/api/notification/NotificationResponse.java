package com.tallerzapata.backend.api.notification;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        Long userId,
        Long caseId,
        String typeCode,
        String title,
        String message,
        Boolean read,
        LocalDateTime readAt,
        String actionUrl,
        String entityType,
        Long entityId,
        LocalDateTime createdAt
) {
}
