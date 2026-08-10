package com.tallerzapata.backend.api.casefile;

import jakarta.validation.constraints.NotBlank;

public record TodoRiesgoNoRepairRequest(@NotBlank String reason) {
}
