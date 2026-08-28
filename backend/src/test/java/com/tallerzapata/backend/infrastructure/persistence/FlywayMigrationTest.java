package com.tallerzapata.backend.infrastructure.persistence;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
class FlywayMigrationTest {

    @Container
    static final MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.4");

    @Autowired private JdbcTemplate jdbcTemplate;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
        registry.add("spring.datasource.driver-class-name", mysql::getDriverClassName);
    }

    @Test
    void migrationsLoadWithTestProfile() {
    }

    @Test
    void legacyIssuedReceiptsKeepTheirOwnDatabaseIdentityAfterFiscalIdentitySplit() {
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'COMPROBANTES_EMITIDOS' AND COLUMN_NAME = 'NUMERO_COMPROBANTE_LEGACY' AND IS_GENERATED = 'ALWAYS'", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'COMPROBANTES_EMITIDOS' AND INDEX_NAME = 'uq_comprobantes_emitidos_identidad_legacy' AND NON_UNIQUE = 0", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM flyway_schema_history WHERE version = '87' AND success = 1", Integer.class)).isEqualTo(1);
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
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'PRESUPUESTO_TRABAJOS_EXTRAS' AND COLUMN_NAME = 'ACTIVO' AND IS_NULLABLE = 'NO'", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'REPUESTOS_CASO' AND COLUMN_NAME IN ('SOURCE_TYPE', 'ACCESSORY_WORK_ID', 'NON_CANONICAL', 'IS_ACCESSORY')", Integer.class)).isEqualTo(4);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'REPUESTOS_CASO_RECONCILIATION_WARNINGS'", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'REPUESTOS_CASO_CANONICAL_BACKFILL_AUDIT'", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'REPUESTOS_CASO' AND INDEX_NAME = 'uq_repuestos_caso_accessory_work' AND NON_UNIQUE = 0", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_NAME = 'REPUESTOS_CASO' AND CONSTRAINT_NAME = 'fk_repuestos_caso_accessory_work' AND CONSTRAINT_TYPE = 'FOREIGN KEY'", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_NAME = 'REPUESTOS_CASO' AND CONSTRAINT_NAME = 'ck_repuestos_caso_source' AND CONSTRAINT_TYPE = 'CHECK'", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'REPUESTOS_CASO' AND COLUMN_NAME = 'SOURCE_TYPE' AND IS_NULLABLE = 'NO'", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM flyway_schema_history WHERE version IN ('63', '64', '66', '67') AND success = 1", Integer.class)).isEqualTo(4);
    }

    @Test
    void extraBudgetMigrationIsSeparateFromV66V68CanonicalAndMainBudgetTables() {
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME IN ('PRESUPUESTOS_EXTRA', 'PRESUPUESTO_EXTRA_VERSIONES', 'PRESUPUESTO_EXTRA_ITEMS', 'PRESUPUESTO_EXTRA_EVENTOS', 'PRESUPUESTO_EXTRA_PAGO_APLICACIONES', 'SECUENCIAS_PRESUPUESTO_EXTRA')", Integer.class)).isEqualTo(6);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_NAME = 'PRESUPUESTO_EXTRA_PAGO_APLICACIONES' AND CONSTRAINT_NAME = 'FK_PRESUPUESTO_EXTRA_PAGO_APLICACIONES_MOVIMIENTO' AND CONSTRAINT_TYPE = 'FOREIGN KEY'", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'PRESUPUESTO_EXTRA_PAGO_APLICACIONES' AND INDEX_NAME = 'UQ_PRESUPUESTO_EXTRA_PAGO_APLICACIONES_MOVIMIENTO' AND NON_UNIQUE = 0", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'PRESUPUESTO_EXTRA_PAGO_APLICACIONES' AND COLUMN_NAME = 'REVIERTE_APLICACION_ID' AND IS_NULLABLE = 'YES'", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'PRESUPUESTO_EXTRA_PAGO_APLICACIONES' AND INDEX_NAME = 'UQ_PRESUPUESTO_EXTRA_PAGO_APLICACIONES_REVERSION' AND NON_UNIQUE = 0", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'PRESUPUESTO_TRABAJOS_EXTRAS' AND COLUMN_NAME = 'ACTIVO'", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM flyway_schema_history WHERE version IN ('66', '68', '69', '70') AND success = 1", Integer.class)).isEqualTo(4);
    }

    @Test
    void extraBudgetTablesStartEmptyWithoutBackfillingMainOrCanonicalData() {
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM presupuestos_extra", Integer.class)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM presupuesto_extra_versiones", Integer.class)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM presupuesto_extra_items", Integer.class)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM presupuesto_extra_pago_aplicaciones", Integer.class)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'PRESUPUESTOS' AND COLUMN_NAME LIKE '%EXTRA%'", Integer.class)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'PRESUPUESTO_TRABAJOS_EXTRAS' AND COLUMN_NAME LIKE '%PAGO%'", Integer.class)).isZero();
    }

    @Test
    void v71KeepsLegacyManualRowsNullableAndEnforcesOneSourcePerExtraVersion() {
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'PRESUPUESTO_EXTRA_ITEMS' AND COLUMN_NAME IN ('SOURCE_TYPE', 'SOURCE_ID') AND IS_NULLABLE = 'YES'", Integer.class)).isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'PRESUPUESTO_EXTRA_ITEMS' AND INDEX_NAME = 'UQ_PRESUPUESTO_EXTRA_ITEMS_SOURCE' AND NON_UNIQUE = 0", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM flyway_schema_history WHERE version IN ('68', '69', '70', '71') AND success = 1", Integer.class)).isEqualTo(4);
    }

    @Test
    void extraBudgetItemsKeepTheNonNullActiveDefaultForDirectLegacyInserts() {
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'PRESUPUESTO_EXTRA_ITEMS' AND COLUMN_NAME = 'ACTIVO' AND IS_NULLABLE = 'NO' AND COLUMN_DEFAULT = '1'", Integer.class)).isEqualTo(1);
    }

    @Test
    void v78AddsExtraContextToTheCommonMatrixWithoutChangingV73TablesOrCreatingRepairParts() {
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'COMPARACION_PRESUPUESTO_SNAPSHOT' AND COLUMN_NAME IN ('CONTEXTO', 'PRESUPUESTO_EXTRA_VERSION_ID')", Integer.class)).isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'COMPARACION_PIEZA' AND COLUMN_NAME IN ('CONTEXTO', 'PRESUPUESTO_EXTRA_ITEM_ORIGEN_ID')", Integer.class)).isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_NAME = 'COMPARACION_PRESUPUESTO_SNAPSHOT' AND CONSTRAINT_NAME = 'FK_COMPARACION_SNAPSHOT_PRESUPUESTO_EXTRA_VERSION' AND CONSTRAINT_TYPE = 'FOREIGN KEY'", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_NAME = 'COMPARACION_PIEZA' AND CONSTRAINT_NAME = 'FK_COMPARACION_PIEZA_PRESUPUESTO_EXTRA_ITEM' AND CONSTRAINT_TYPE = 'FOREIGN KEY'", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME IN ('COMPARACION_PRESUPUESTO_EXTRA_PIEZAS', 'COMPARACION_PRESUPUESTO_EXTRA_COTIZACIONES')", Integer.class)).isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM repuestos_caso", Integer.class)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM flyway_schema_history WHERE version = '78' AND success = 1", Integer.class)).isEqualTo(1);
    }
}
