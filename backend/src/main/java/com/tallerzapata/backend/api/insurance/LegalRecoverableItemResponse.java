package com.tallerzapata.backend.api.insurance;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LegalRecoverableItemResponse(Long id, String concept, BigDecimal amount, LocalDate expectedPaymentDate, Boolean sumsToWorkshop, LocalDate effectivePaymentDate, String collectionStatusCode, Long financialMovementId, Boolean active) {}
