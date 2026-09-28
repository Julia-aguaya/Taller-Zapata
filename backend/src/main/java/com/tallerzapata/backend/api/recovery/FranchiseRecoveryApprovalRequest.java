package com.tallerzapata.backend.api.recovery;

import jakarta.validation.constraints.NotBlank;

public record FranchiseRecoveryApprovalRequest(@NotBlank String reason) {
}
