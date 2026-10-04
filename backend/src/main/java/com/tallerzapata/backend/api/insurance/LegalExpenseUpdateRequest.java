package com.tallerzapata.backend.api.insurance;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LegalExpenseUpdateRequest(String concept, BigDecimal amount, LocalDate expenseDate, String paidByCode) { }
