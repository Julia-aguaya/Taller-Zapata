package com.tallerzapata.backend.api.insurance;

import java.math.BigDecimal;

public record LegalRecoverableItemCreateRequest(String concept, BigDecimal amount, Boolean sumsToWorkshop) {}
