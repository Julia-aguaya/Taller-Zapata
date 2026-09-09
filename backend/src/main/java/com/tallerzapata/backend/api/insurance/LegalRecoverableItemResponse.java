package com.tallerzapata.backend.api.insurance;

import java.math.BigDecimal;

public record LegalRecoverableItemResponse(Long id, String concept, BigDecimal amount, Boolean sumsToWorkshop, String collectionStatusCode, Long financialMovementId) {}
