package com.tallerzapata.backend.infrastructure.persistence;

import com.tallerzapata.backend.testsupport.TestDatabaseCleaner;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class FlywayMigrationTest {

    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private TestDatabaseCleaner cleaner;

    @BeforeEach
    void cleanTransactions() {
        cleaner.cleanAll();
    }

    @Test
    void migrationsLoadWithTestProfile() {
    }

    @Test
    void providerMigrationAddsNullableReferencesWithoutBackfill() {
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'PROVEEDORES' AND COLUMN_NAME = 'PUBLIC_ID' AND DATA_TYPE = 'CHARACTER' AND CHARACTER_MAXIMUM_LENGTH = 36 AND IS_NULLABLE = 'NO'", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME IN ('REPUESTOS_CASO', 'COTIZACIONES_REPUESTO', 'PRESUPUESTOS', 'CASO_TRAMITACION_SEGURO') AND COLUMN_NAME = 'PROVEEDOR_ID' AND IS_NULLABLE = 'YES'", Integer.class)).isEqualTo(4);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM repuestos_caso WHERE proveedor_id IS NOT NULL", Integer.class)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM cotizaciones_repuesto WHERE proveedor_id IS NOT NULL", Integer.class)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM presupuestos WHERE proveedor_id IS NOT NULL", Integer.class)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM caso_tramitacion_seguro WHERE proveedor_id IS NOT NULL", Integer.class)).isZero();
    }
}
