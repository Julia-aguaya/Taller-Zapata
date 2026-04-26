package com.tallerzapata.backend.api.casefile;

import java.time.LocalDateTime;

public record CaseUpdateRequest(
        Boolean referenced,
        Long referredByPersonId,
        String referredByText,
        String priorityCode,
        String generalObservations,
        LocalDateTime closedAt,
        LocalDateTime archivedAt
) {
}
