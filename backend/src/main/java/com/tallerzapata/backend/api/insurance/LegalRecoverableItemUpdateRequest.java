package com.tallerzapata.backend.api.insurance;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LegalRecoverableItemUpdateRequest(String concept, BigDecimal amount, LocalDate expectedPaymentDate, Boolean sumsToWorkshop, LocalDate effectivePaymentDate) { }
