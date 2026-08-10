package com.tallerzapata.backend.api.panel;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.tallerzapata.backend.api.casefile.CaseVisibleStateResponse;

import java.time.LocalDateTime;
import java.util.List;

public record PanelPriorityCaseResponse(
        Long caseId,
        String folderCode,
        String title,
        String caseTypeCode,
        @JsonInclude(JsonInclude.Include.NON_NULL) String tramiteCode,
        @JsonInclude(JsonInclude.Include.NON_NULL) String reparacionCode,
        CaseVisibleStateResponse visibleTramiteState,
        CaseVisibleStateResponse visibleRepairState,
        List<String> priorityReasons,
        LocalDateTime closedAt,
        LocalDateTime createdAt
) {
}
