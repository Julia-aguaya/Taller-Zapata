package com.tallerzapata.backend.api.operation;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record OperationalTaskUpdateRequest(
        String originModuleCode,
        String originSubtabCode,
        @NotBlank @Size(max = 160) String title,
        String description,
        LocalDate dueDate,
        @NotBlank String priorityCode,
        @NotBlank String statusCode,
        Long assignedUserId,
        JsonNode payload
) {
}
