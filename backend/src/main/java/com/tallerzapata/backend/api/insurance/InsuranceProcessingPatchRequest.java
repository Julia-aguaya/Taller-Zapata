package com.tallerzapata.backend.api.insurance;

import com.fasterxml.jackson.databind.JsonNode;

/** JsonNode preserves the difference between an omitted field and an explicit null. */
public record InsuranceProcessingPatchRequest(
        Long expectedVersion,
        JsonNode presentedAt,
        JsonNode inspectionForwardedAt,
        JsonNode inspectionDate,
        JsonNode modalityCode,
        JsonNode opinionCode,
        JsonNode quotationStatusCode,
        JsonNode quotationDate,
        JsonNode agreedAmount,
        JsonNode partsAuthorizationCode,
        JsonNode partsSupplierText,
        JsonNode providerId,
        JsonNode finalAmountForWorkshop,
        JsonNode passedToPaymentsAt,
        JsonNode estimatedPaymentDate,
        Boolean allowBelowMinimum
) {
    public boolean has(String field) {
        return switch (field) {
            case "presentedAt" -> presentedAt != null;
            case "inspectionForwardedAt" -> inspectionForwardedAt != null;
            case "inspectionDate" -> inspectionDate != null;
            case "modalityCode" -> modalityCode != null;
            case "opinionCode" -> opinionCode != null;
            case "quotationStatusCode" -> quotationStatusCode != null;
            case "quotationDate" -> quotationDate != null;
            case "agreedAmount" -> agreedAmount != null;
            case "partsAuthorizationCode" -> partsAuthorizationCode != null;
            case "partsSupplierText" -> partsSupplierText != null;
            case "providerId" -> providerId != null;
            case "finalAmountForWorkshop" -> finalAmountForWorkshop != null;
            case "passedToPaymentsAt" -> passedToPaymentsAt != null;
            case "estimatedPaymentDate" -> estimatedPaymentDate != null;
            default -> false;
        };
    }
}
