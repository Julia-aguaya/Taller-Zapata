package com.tallerzapata.backend.infrastructure.persistence.budget;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CasePartEntityMappingTest {

    @Test
    void mapsProviderAssignmentOriginAsAStringEnum() throws NoSuchFieldException {
        var field = CasePartEntity.class.getDeclaredField("providerAssignmentOrigin");

        assertThat(field.getType()).isEqualTo(ProviderAssignmentOrigin.class);
        assertThat(field.getAnnotation(Enumerated.class).value()).isEqualTo(EnumType.STRING);
    }
}
