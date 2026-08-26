package com.tallerzapata.backend.api.extrabudget;

import com.tallerzapata.backend.infrastructure.persistence.extrabudget.ExtraBudgetStatus;

import java.math.BigDecimal;
import java.util.List;

public record ExtraBudgetResponse(
        Long id,
        Long caseId,
        Long issuedNumber,
        Integer currentVersion,
        Long versionLock,
        ExtraBudgetStatus currentStatus,
        String customerConfirmation,
        Long acceptedVersionId,
        BigDecimal total,
        BigDecimal paidAmount,
        BigDecimal balance,
        List<Payment> payments,
        List<Version> versions,
        Activation activation
) {
    public record Version(
            Long id,
            Integer number,
            ExtraBudgetStatus status,
            BigDecimal partsTotal,
            BigDecimal laborWithoutVat,
            BigDecimal laborVat,
            BigDecimal laborWithVat,
            BigDecimal total,
            BigDecimal generalLaborAmount,
            Boolean generalLaborVatApplies,
            String notes,
            boolean pdfAvailable,
            Long comparisonSnapshotId,
            List<Item> items
    ) {
    }

    public record Item(
            Integer visualOrder,
            String description,
            BigDecimal quantity,
            BigDecimal partUnitAmount,
            BigDecimal laborUnitAmount,
            BigDecimal partsTotal,
            BigDecimal laborTotal,
            BigDecimal lineTotal,
            String sourceType,
            Long sourceId,
            String affectedPiece,
            String taskCode,
            String actionCode,
            String damageLevelCode,
            BigDecimal partsAmount,
            Boolean active,
            Long itemId
        ) {
    }

    public record Payment(Long id, Long movementId, Long versionId, BigDecimal amount, Long reversedApplicationId) {
    }

    public record Activation(boolean active, boolean requiresDeactivationConfirmation, boolean deactivationEligible,
                             List<String> deactivationReasons) {
    }
}
