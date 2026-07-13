package com.tallerzapata.backend.api.panel;

import java.time.LocalDateTime;
import java.util.List;

public record PanelGeneralResponse(
        LocalDateTime generatedAt,
        PanelSummaryResponse summary,
        List<PanelPriorityBucketResponse> priorityBuckets
) {
}
