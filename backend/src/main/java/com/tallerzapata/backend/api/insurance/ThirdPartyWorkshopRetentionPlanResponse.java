package com.tallerzapata.backend.api.insurance;

import java.math.BigDecimal;
import java.util.List;

public record ThirdPartyWorkshopRetentionPlanResponse(Long caseId, Long version, List<Item> retentions) {
    public record Item(Long id, String retentionTypeCode, BigDecimal amount, String detail) { }
}
