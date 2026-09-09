package com.tallerzapata.backend.api.insurance;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BelowMinimumAgreementApprovalResponse(
        String status,
        BigDecimal proposedAmount,
        BigDecimal expectedMinimumAmount,
        Long requestedByUserId,
        String reason,
        LocalDateTime requestedAt,
        LocalDateTime decidedAt,
        Long approvedByAdminId,
        boolean canApprove
) { }
