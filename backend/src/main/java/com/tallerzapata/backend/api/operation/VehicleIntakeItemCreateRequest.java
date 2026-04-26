package com.tallerzapata.backend.api.operation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VehicleIntakeItemCreateRequest(
        @NotBlank String itemTypeCode,
        @NotBlank @Size(max = 255) String detail,
        @NotBlank String statusCode,
        String mediaReference
) {
}
