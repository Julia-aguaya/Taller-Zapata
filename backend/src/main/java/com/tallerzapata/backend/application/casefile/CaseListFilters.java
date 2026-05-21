package com.tallerzapata.backend.application.casefile;

import java.time.LocalDate;

public record CaseListFilters(
        String folderStatus,
        LocalDate openedFrom,
        LocalDate openedTo,
        LocalDate paidFrom,
        LocalDate paidTo,
        String caseTypeCode,
        String opinionCode,
        String managerCode,
        String visibleTramiteState,
        String visibleRepairState,
        String paymentStateCode,
        Boolean hasPendingTasks,
        Long pendingTaskAssignedUserId
) {
}
