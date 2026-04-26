package com.tallerzapata.backend.application.vehicle;

public final class VehiclePlateNormalizer {

    private VehiclePlateNormalizer() {
    }

    public static String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
    }
}
