package com.tallerzapata.backend.api.budget;

import jakarta.validation.constraints.NotBlank;

public record CasePartWarningResolutionRequest(@NotBlank String resolution) {}
