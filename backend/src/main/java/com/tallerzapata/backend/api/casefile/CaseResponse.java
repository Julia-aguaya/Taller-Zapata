package com.tallerzapata.backend.api.casefile;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

public record CaseResponse(
        Long id,
        String publicId,
        String folderCode,
        Long orderNumber,
        Long caseTypeId,
        String caseTypeCode,
        Long organizationId,
        Long branchId,
        String branchCode,
        Long principalVehicleId,
        Long principalCustomerPersonId,
        Boolean referenced,
        Long referenciadorId,
        Long currentCaseStateId,
        String currentCaseStateCode,
        Long currentRepairStateId,
        String currentRepairStateCode,
        Long currentPaymentStateId,
        String currentPaymentStateCode,
        Long currentDocumentationStateId,
        String currentDocumentationStateCode,
        Long currentLegalStateId,
        String currentLegalStateCode,
        String priorityCode,
        String generalObservations,
        LocalDateTime closedAt,
        LocalDateTime archivedAt,
        Long createdByUserId,
        String createdByDisplayName,
        LocalDateTime createdAt,
        @JsonInclude(JsonInclude.Include.NON_NULL) String tramiteCode,
        @JsonInclude(JsonInclude.Include.NON_NULL) String reparacionCode,
        CaseVisibleStateResponse visibleTramiteState,
        CaseVisibleStateResponse visibleRepairState,
        String principalCustomerName,
        String principalVehiclePlate
) {
}
