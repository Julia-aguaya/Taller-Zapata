package com.tallerzapata.backend.application.vehicle;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class VehiclePlateNormalizerTest {

    @Test
    void shouldNormalizePlateRemovingSpacesAndDashes() {
        assertEquals("AB123CD", VehiclePlateNormalizer.normalize("ab-123 cd"));
    }
}
