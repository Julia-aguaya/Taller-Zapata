package com.tallerzapata.backend.application.person;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class PersonDocumentNormalizerTest {

    @Test
    void shouldNormalizeDocumentRemovingSeparators() {
        assertEquals("12345678", PersonDocumentNormalizer.normalize("12.345.678"));
    }

    @Test
    void shouldReturnNullForBlankValues() {
        assertNull(PersonDocumentNormalizer.normalize("  "));
    }
}
