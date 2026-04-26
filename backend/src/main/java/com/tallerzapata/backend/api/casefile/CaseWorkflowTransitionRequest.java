package com.tallerzapata.backend.api.casefile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CaseWorkflowTransitionRequest(
        @NotBlank String domain,
        @NotBlank String actionCode,
        String reason,
        Boolean automatic
) {
}
