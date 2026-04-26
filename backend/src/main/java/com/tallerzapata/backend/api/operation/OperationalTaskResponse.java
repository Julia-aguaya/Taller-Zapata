package com.tallerzapata.backend.api.operation;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record OperationalTaskResponse(
        Long id,
        String publicId,
        Long caseId,
        Long organizationId,
        Long branchId,
        String originModuleCode,
        String originSubtabCode,
        String title,
        String description,
        LocalDate dueDate,
        String priorityCode,
        String statusCode,
        Long assignedUserId,
        Long createdBy,
        Boolean resolved,
        LocalDateTime resolvedAt,
        JsonNode payload,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
