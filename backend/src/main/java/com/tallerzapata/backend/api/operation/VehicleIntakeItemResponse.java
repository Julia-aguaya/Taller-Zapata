package com.tallerzapata.backend.api.operation;

import java.time.LocalDateTime;

public record VehicleIntakeItemResponse(
        Long id,
        Long intakeId,
        String itemTypeCode,
        String detail,
        String statusCode,
        String mediaReference,
        LocalDateTime createdAt
) {
}
