package com.tallerzapata.backend.infrastructure.persistence;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class FlywayMigrationTest {

    @Test
    void migrationsLoadWithTestProfile() {
    }
}
