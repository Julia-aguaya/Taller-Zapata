package com.tallerzapata.backend.api.finance;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;

public record ParticularComprobanteIntentRequest(
        @NotBlank @Pattern(regexp = "A|C|R") String comprobanteTipo
) {
}
