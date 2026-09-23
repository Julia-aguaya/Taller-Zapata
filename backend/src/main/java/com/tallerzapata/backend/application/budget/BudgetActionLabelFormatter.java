package com.tallerzapata.backend.application.budget;

import java.util.Locale;

final class BudgetActionLabelFormatter {
    private BudgetActionLabelFormatter() {}

    static String format(String value) {
        if (value == null || value.isBlank()) return "-";
        String words = value.trim().replace('_', ' ').toLowerCase(Locale.ROOT);
        return Character.toUpperCase(words.charAt(0)) + words.substring(1);
    }
}
