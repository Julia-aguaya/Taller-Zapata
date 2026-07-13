package com.tallerzapata.backend.api.panel;

import java.util.List;

public record PanelPriorityBucketResponse(
        String code,
        String label,
        List<PanelPriorityCaseResponse> items
) {
}
