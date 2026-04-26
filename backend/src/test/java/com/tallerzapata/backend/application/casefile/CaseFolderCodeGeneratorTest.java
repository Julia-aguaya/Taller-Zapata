package com.tallerzapata.backend.application.casefile;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CaseFolderCodeGeneratorTest {

    @Test
    void shouldGenerateFolderCodeWithPaddingPrefixAndBranchCode() {
        String result = CaseFolderCodeGenerator.generate(12L, "P", "Z");

        assertEquals("0012PZ", result);
    }
}
