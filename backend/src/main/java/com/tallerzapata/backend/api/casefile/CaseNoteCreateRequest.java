package com.tallerzapata.backend.api.casefile;

import jakarta.validation.constraints.NotBlank;

public record CaseNoteCreateRequest(
        @NotBlank String text
) {
}
