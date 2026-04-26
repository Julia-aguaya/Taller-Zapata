package com.tallerzapata.backend.application.person;

public final class PersonDocumentNormalizer {

    private PersonDocumentNormalizer() {
    }

    public static String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
    }
}
