package com.tallerzapata.backend.api.panel;

import com.tallerzapata.backend.api.casefile.CaseVisibleStateResponse;

import java.time.LocalDateTime;
import java.util.List;

public record PanelPriorityCaseResponse(
        Long caseId,
        String folderCode,
        String title,
        String caseTypeCode,
        CaseVisibleStateResponse visibleTramiteState,
        CaseVisibleStateResponse visibleRepairState,
        List<String> priorityReasons,
        LocalDateTime closedAt,
        LocalDateTime createdAt
) {
}
