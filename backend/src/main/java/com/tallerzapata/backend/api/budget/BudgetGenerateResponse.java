package com.tallerzapata.backend.api.budget;

public record BudgetGenerateResponse(BudgetResponse budget, BudgetComparisonDtos.Snapshot comparisonSnapshot) { }
