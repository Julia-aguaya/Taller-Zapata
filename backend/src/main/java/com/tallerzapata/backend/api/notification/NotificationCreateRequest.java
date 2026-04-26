package com.tallerzapata.backend.api.notification;

public record NotificationCreateRequest(
        Long userId,
        Long caseId,
        String typeCode,
        String title,
        String message,
        String actionUrl,
        String entityType,
        Long entityId
) {
}
