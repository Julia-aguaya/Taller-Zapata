package com.tallerzapata.backend.api.cleas;

import java.time.LocalDateTime;

public record CleasClosureResponse(Long caseId, LocalDateTime closedAt) {
}
