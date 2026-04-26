package com.tallerzapata.backend.api.casefile;

import java.time.LocalDateTime;

public record CaseWorkflowHistoryResponse(
        Long id,
        String domain,
        Long stateId,
        String stateCode,
        String stateName,
        LocalDateTime stateDate,
        Long userId,
        Boolean automatic,
        String reason
) {
}
