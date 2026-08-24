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

    @Test
    void insuranceProcessingMigrationAddsInspectionDateAndVersion() {
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CASO_TRAMITACION_SEGURO' AND COLUMN_NAME = 'FECHA_INSPECCION' AND DATA_TYPE = 'DATE' AND IS_NULLABLE = 'YES'", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CASO_TRAMITACION_SEGURO' AND COLUMN_NAME = 'VERSION' AND DATA_TYPE = 'BIGINT' AND IS_NULLABLE = 'NO'", Integer.class)).isEqualTo(1);
    }

    @Test
    void insuranceProcessingModalitiesAreLimitedToPresentialAndPhotos() {
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM modalidades_tramitacion_seguro", Integer.class)).isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM modalidades_tramitacion_seguro WHERE codigo = 'PRESENCIAL' AND nombre = 'Presencial' AND activo = 1", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM modalidades_tramitacion_seguro WHERE codigo = 'POR_FOTOS' AND nombre = 'Por fotos' AND activo = 1", Integer.class)).isEqualTo(1);
    }

    @Test
    void comparisonMatrixMigrationKeepsLegacyOffersAndAddsScopedUniqueColumnsAndPrices() {
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'COMPARACION_PRESUPUESTO_SNAPSHOT' AND COLUMN_NAME = 'MODO' AND IS_NULLABLE = 'NO'", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME IN ('COMPARACION_PROVEEDOR', 'COMPARACION_PRECIO')", Integer.class)).isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'COMPARACION_PROVEEDOR' AND INDEX_NAME = 'uq_comparacion_proveedor_snapshot_proveedor' AND NON_UNIQUE = 0", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'COMPARACION_PRECIO' AND INDEX_NAME = 'uq_comparacion_precio_pieza_proveedor' AND NON_UNIQUE = 0", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'COMPARACION_OFERTA'", Integer.class)).isEqualTo(1);
    }

    @Test
    void canonicalPartMigrationAddsValidatedSourcesWarningsAndBackfillAuditWithoutChangingPriorMigrations() {
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'REPUESTOS_CASO' AND COLUMN_NAME IN ('SOURCE_TYPE', 'ACCESSORY_WORK_ID', 'NON_CANONICAL', 'IS_ACCESSORY')", Integer.class)).isEqualTo(4);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'REPUESTOS_CASO_RECONCILIATION_WARNINGS'", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'REPUESTOS_CASO_CANONICAL_BACKFILL_AUDIT'", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'REPUESTOS_CASO' AND INDEX_NAME = 'uq_repuestos_caso_accessory_work' AND NON_UNIQUE = 0", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_NAME = 'REPUESTOS_CASO' AND CONSTRAINT_NAME = 'ck_repuestos_caso_source' AND CONSTRAINT_TYPE = 'CHECK'", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'REPUESTOS_CASO' AND COLUMN_NAME = 'SOURCE_TYPE' AND IS_NULLABLE = 'NO'", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM flyway_schema_history WHERE version IN ('63', '64', '66', '67') AND success = 1", Integer.class)).isEqualTo(4);
    }
}
