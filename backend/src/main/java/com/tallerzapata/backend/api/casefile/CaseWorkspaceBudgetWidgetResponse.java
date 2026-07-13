package com.tallerzapata.backend.api.casefile;

import java.math.BigDecimal;

public record CaseWorkspaceBudgetWidgetResponse(
        Boolean exists,
        String reportStatusCode,
        BigDecimal totalQuoted
) {
}
