package com.tallerzapata.backend.api.extrabudget;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tallerzapata.backend.testsupport.TestDatabaseCleaner;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ExtraBudgetComparisonIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private ObjectMapper json;
    @Autowired private TestDatabaseCleaner cleaner;

    @BeforeEach
    void setUp() {
        cleaner.cleanAll();
        jdbc.update("INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (3, '00000000-0000-0000-0000-000000000300', 'operador', 'operador@taller.local', 'hash', 'Olivia', 'Operadora', true)");
        jdbc.update("INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (3, 3, 2, 1, 1, true)");
        jdbc.update("INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo) VALUES (100, '00000000-0000-0000-0000-000000003100', '0100PZ', 100, 2, 1, 1, false, 1, 1, 4, 7, 9, 11, 'MEDIA')");
        jdbc.update("INSERT INTO presupuestos_extra (id, caso_id, organizacion_id, sucursal_id, version_actual, monto_deuda_aceptada, estado_actual, version_lock) VALUES (800, 100, 1, 1, 1, 0, 'BORRADOR', 0)");
        jdbc.update("INSERT INTO presupuesto_extra_versiones (id, presupuesto_extra_id, numero_version, estado) VALUES (801, 800, 1, 'BORRADOR')");
        jdbc.update("INSERT INTO presupuesto_extra_items (id, presupuesto_extra_version_id, orden_visual, descripcion, cantidad, importe_unitario_repuesto, importe_unitario_mano_obra, total_repuestos, total_mano_obra, total_linea, source_type, source_id, pieza_afectada, monto_repuestos, activo, accion_codigo) VALUES (900, 801, 1, 'Espejo extra', 1, 0, 0, 0, 0, 0, 'EXTRA_BUDGET_ITEM', 900, 'Espejo', 0, true, 'REEMPLAZAR')");
        jdbc.update("INSERT INTO proveedores (id, public_id, nombre, activo) VALUES (20, '00000000-0000-0000-0000-000000000020', 'Proveedor Uno', true), (21, '00000000-0000-0000-0000-000000000021', 'Proveedor Dos', true)");
    }

    @Test
    void keepsOneIsolatedPieceAndUpdatesOnlyTheSelectedExtraItemWithoutCreatingRepairParts() throws Exception {
        quote(20, "150.00");
        JsonNode second = quote(21, "120.00");
        assertThat(second.get("pieceId").asLong()).isPositive();
        assertThat(second.get("quotes").size()).isEqualTo(2);
        assertThat(second.get("quotes").get(1).get("best").asBoolean()).isTrue();

        select(20);
        quote(20, "110.00");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM comparacion_presupuesto_extra_piezas WHERE presupuesto_extra_item_id = 900", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT proveedor_seleccionado_id FROM presupuesto_extra_items WHERE id = 900", Long.class)).isEqualTo(20L);
        assertThat(jdbc.queryForObject("SELECT importe_cotizacion_seleccionada FROM presupuesto_extra_items WHERE id = 900", BigDecimal.class)).isEqualByComparingTo("110.00");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM repuestos_caso WHERE caso_id = 100", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM comparacion_presupuesto_snapshot", Integer.class)).isZero();
    }

    @Test
    void exposesTheCanonicalItemIdAcrossDraftGetAndPresentationForTheIsolatedComparisonWorkflow() throws Exception {
        JsonNode draft = json.readTree(mockMvc.perform(put("/api/v1/cases/100/extra-budget/draft").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":0,\"items\":[{\"visualOrder\":1,\"description\":\"Espejo extra\",\"quantity\":1,\"partUnitAmount\":100,\"laborUnitAmount\":0}]}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        long itemId = draft.at("/versions/0/items/0/itemId").asLong();
        assertThat(itemId).isPositive();

        JsonNode loaded = json.readTree(mockMvc.perform(get("/api/v1/cases/100/extra-budget").header("X-User-Id", "3"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(loaded.at("/versions/0/items/0/itemId").asLong()).isEqualTo(itemId);

        JsonNode quoted = json.readTree(mockMvc.perform(post("/api/v1/cases/100/extra-budget/comparison/quotes").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":0,\"itemId\":" + itemId + ",\"providerId\":20,\"amount\":100}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(quoted.get("itemId").asLong()).isEqualTo(itemId);

        mockMvc.perform(post("/api/v1/cases/100/extra-budget/comparison/select").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":0,\"itemId\":" + itemId + ",\"providerId\":20}"))
                .andExpect(status().isOk());
        JsonNode presented = json.readTree(mockMvc.perform(post("/api/v1/cases/100/extra-budget/present").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":0}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(presented.at("/versions/0/items/0/itemId").asLong()).isEqualTo(itemId);
    }

    @Test
    void doesNotExposeAnItemIdForLegacyRows() throws Exception {
        jdbc.update("UPDATE presupuestos_extra SET activo = false WHERE id = 800");
        jdbc.update("UPDATE presupuesto_extra_items SET source_type = 'V66_ACCESSORY_WORK', source_id = 77 WHERE id = 900");

        JsonNode response = json.readTree(mockMvc.perform(get("/api/v1/cases/100/extra-budget").header("X-User-Id", "3"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());

        assertThat(response.at("/versions/0/items/0/itemId").isNull()).isTrue();
    }

    @Test
    void sourceConstraintAcceptsLegacyAndCanonicalExtraBudgetItemSources() {
        jdbc.update("UPDATE presupuesto_extra_items SET source_type = 'V66_ACCESSORY_WORK', source_id = 77 WHERE id = 900");

        jdbc.update("INSERT INTO presupuesto_extra_items (id, presupuesto_extra_version_id, orden_visual, descripcion, cantidad, importe_unitario_repuesto, importe_unitario_mano_obra, total_repuestos, total_mano_obra, total_linea, source_type, source_id, monto_repuestos, activo, accion_codigo) VALUES (901, 801, 2, 'Canonical extra', 1, 0, 0, 0, 0, 0, 'EXTRA_BUDGET_ITEM', 901, 0, true, 'REEMPLAZAR')");
        jdbc.update("INSERT INTO presupuesto_extra_items (id, presupuesto_extra_version_id, orden_visual, descripcion, cantidad, importe_unitario_repuesto, importe_unitario_mano_obra, total_repuestos, total_mano_obra, total_linea, monto_repuestos, activo, accion_codigo) VALUES (902, 801, 3, 'Manual legacy', 1, 0, 0, 0, 0, 0, 0, true, 'REEMPLAZAR')");

        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM presupuesto_extra_items WHERE source_type = 'V66_ACCESSORY_WORK' AND source_id = 77", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM presupuesto_extra_items WHERE source_type = 'EXTRA_BUDGET_ITEM' AND source_id = 901", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM presupuesto_extra_items WHERE source_type IS NULL AND source_id IS NULL", Integer.class)).isEqualTo(1);
    }

    @Test
    void confirmsOnlyActiveCanonicalReplacementItemsAndKeepsPromotionIdempotent() throws Exception {
        jdbc.update("UPDATE presupuestos_extra SET estado_actual = 'PRESENTADO' WHERE id = 800");
        jdbc.update("UPDATE presupuesto_extra_versiones SET estado = 'PRESENTADO', total = 120 WHERE id = 801");
        jdbc.update("UPDATE presupuesto_extra_items SET monto_repuestos = 120, proveedor_seleccionado_id = 20, proveedor_seleccionado_nombre = 'Proveedor Uno', importe_cotizacion_seleccionada = 110 WHERE id = 900");
        jdbc.update("INSERT INTO presupuesto_extra_items (id, presupuesto_extra_version_id, orden_visual, descripcion, cantidad, importe_unitario_repuesto, importe_unitario_mano_obra, total_repuestos, total_mano_obra, total_linea, source_type, source_id, monto_repuestos, activo, accion_codigo) VALUES (901, 801, 2, 'Inactivo', 1, 0, 0, 0, 0, 0, 'EXTRA_BUDGET_ITEM', 901, 50, false, 'REEMPLAZAR')");

        JsonNode confirmed = json.readTree(mockMvc.perform(post("/api/v1/cases/100/extra-budget/confirm").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":0,\"confirmation\":\"SI\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());

        assertThat(confirmed.get("customerConfirmation").asText()).isEqualTo("SI");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM repuestos_caso WHERE caso_id = 100 AND source_type = 'EXTRA_BUDGET_ITEM'", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT proveedor_id FROM repuestos_caso WHERE presupuesto_extra_item_id = 900", Long.class)).isEqualTo(20L);
        assertThat(jdbc.queryForObject("SELECT precio_final FROM repuestos_caso WHERE presupuesto_extra_item_id = 900", BigDecimal.class)).isEqualByComparingTo("110.00");

        mockMvc.perform(post("/api/v1/cases/100/extra-budget/confirm").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":" + confirmed.get("versionLock").asLong() + ",\"confirmation\":\"SI\"}"))
                .andExpect(status().isOk());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM repuestos_caso WHERE caso_id = 100 AND source_type = 'EXTRA_BUDGET_ITEM'", Integer.class)).isEqualTo(1);
    }

    @Test
    void confirmsReplacementAtManualPriceWithoutASelectedComparisonQuoteAndPromotesOnlyOnce() throws Exception {
        jdbc.update("UPDATE presupuestos_extra SET estado_actual = 'PRESENTADO' WHERE id = 800");
        jdbc.update("UPDATE presupuesto_extra_versiones SET estado = 'PRESENTADO', total = 120 WHERE id = 801");
        jdbc.update("UPDATE presupuesto_extra_items SET monto_repuestos = 120, proveedor_seleccionado_id = NULL, proveedor_seleccionado_nombre = NULL, importe_cotizacion_seleccionada = NULL WHERE id = 900");

        JsonNode confirmed = json.readTree(mockMvc.perform(post("/api/v1/cases/100/extra-budget/confirm").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":0,\"confirmation\":\"SI\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());

        assertThat(confirmed.get("customerConfirmation").asText()).isEqualTo("SI");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM repuestos_caso WHERE caso_id = 100 AND source_type = 'EXTRA_BUDGET_ITEM'", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT proveedor_id FROM repuestos_caso WHERE presupuesto_extra_item_id = 900", Long.class)).isNull();
        assertThat(jdbc.queryForObject("SELECT proveedor_final FROM repuestos_caso WHERE presupuesto_extra_item_id = 900", String.class)).isNull();
        assertThat(jdbc.queryForObject("SELECT precio_final FROM repuestos_caso WHERE presupuesto_extra_item_id = 900", BigDecimal.class)).isEqualByComparingTo("120.00");

        mockMvc.perform(post("/api/v1/cases/100/extra-budget/confirm").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":" + confirmed.get("versionLock").asLong() + ",\"confirmation\":\"SI\"}"))
                .andExpect(status().isOk());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM repuestos_caso WHERE caso_id = 100 AND source_type = 'EXTRA_BUDGET_ITEM'", Integer.class)).isEqualTo(1);
    }

    @Test
    void cleanDeactivationRemovesOnlyCleanPromotedPartsAndRecordsReversalMetadata() throws Exception {
        jdbc.update("UPDATE presupuestos_extra SET estado_actual = 'ACEPTADO', confirmacion_cliente = 'SI' WHERE id = 800");
        jdbc.update("UPDATE presupuesto_extra_versiones SET estado = 'ACEPTADO' WHERE id = 801");
        jdbc.update("INSERT INTO repuestos_caso (caso_id, descripcion, estado_codigo, usado, devuelto, non_canonical, is_accessory, source_type, presupuesto_extra_item_id) VALUES (100, 'Extra confirmado', 'PENDIENTE', false, false, false, true, 'EXTRA_BUDGET_ITEM', 900)");
        jdbc.update("INSERT INTO repuestos_caso (caso_id, descripcion, estado_codigo, usado, devuelto, non_canonical, is_accessory, source_type) VALUES (100, 'Repuesto principal', 'PENDIENTE', false, false, false, false, 'BUDGET_ITEM')");
        jdbc.update("INSERT INTO movimientos_financieros (public_id, caso_id, tipo_movimiento_codigo, origen_flujo_codigo, contraparte_tipo_codigo, fecha_movimiento, monto_bruto, monto_neto, medio_pago_codigo, es_senia, es_bonificacion, registrado_por) VALUES ('00000000-0000-0000-0000-000000009900', 100, 'INGRESO', 'ASEGURADORA', 'COMPANIA', CURRENT_TIMESTAMP, 50, 50, 'EFECTIVO', false, false, 3)");

        mockMvc.perform(post("/api/v1/cases/100/extra-budget/activation").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":0,\"active\":false,\"confirmDeactivation\":true}"))
                .andExpect(status().isOk());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM repuestos_caso WHERE caso_id = 100 AND source_type = 'EXTRA_BUDGET_ITEM'", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM repuestos_caso WHERE caso_id = 100 AND source_type = 'BUDGET_ITEM'", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM presupuestos_extra WHERE id = 800 AND revertido_at IS NOT NULL AND revertido_by = 3 AND motivo_reversion = 'DESACTIVACION'", Integer.class)).isEqualTo(1);

        jdbc.update("INSERT INTO repuestos_caso (caso_id, descripcion, estado_codigo, usado, devuelto, non_canonical, is_accessory, source_type, presupuesto_extra_item_id, fecha_recibido) VALUES (100, 'Extra con recepción', 'PENDIENTE', false, false, false, true, 'EXTRA_BUDGET_ITEM', 900, CURRENT_DATE)");
        mockMvc.perform(post("/api/v1/cases/100/extra-budget/activation").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":1,\"active\":false,\"confirmDeactivation\":true}"))
                .andExpect(status().isConflict());
    }

    @Test
    void activationHidesDraftWithoutDeletingDataAndRequiresConfirmationWhenDataExists() throws Exception {
        mockMvc.perform(post("/api/v1/cases/100/extra-budget/activation").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":0,\"active\":false}"))
                .andExpect(status().isConflict());

        JsonNode hidden = json.readTree(mockMvc.perform(post("/api/v1/cases/100/extra-budget/activation").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":0,\"active\":false,\"confirmDeactivation\":true}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(hidden.get("activation").get("active").asBoolean()).isFalse();
        assertThat(hidden.get("activation").get("requiresDeactivationConfirmation").asBoolean()).isTrue();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM presupuesto_extra_items WHERE presupuesto_extra_version_id = 801", Integer.class)).isEqualTo(1);

        JsonNode reloaded = json.readTree(mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/cases/100/extra-budget").header("X-User-Id", "3"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(reloaded.get("activation").get("active").asBoolean()).isFalse();
    }

    @Test
    void savesACompleteExtraDraftWithoutLaborVatOrQuotesAndUsesTheCommonExtraMatrix() throws Exception {
        JsonNode draft = json.readTree(mockMvc.perform(put("/api/v1/cases/100/extra-budget/draft").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":0,\"items\":[{\"visualOrder\":1,\"description\":\"Espejo extra\",\"quantity\":1,\"partUnitAmount\":0,\"affectedPiece\":\"Espejo\",\"actionCode\":\"REEMPLAZAR\",\"damageLevelCode\":\"LEVE\",\"partsAmount\":0,\"active\":true}]}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());

        long itemId = draft.at("/versions/0/items/0/itemId").asLong();
        long snapshotId = draft.at("/versions/0/comparisonSnapshotId").asLong();
        assertThat(draft.at("/versions/0/generalLaborVatApplies").asBoolean()).isFalse();
        assertThat(snapshotId).isPositive();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM comparacion_pieza WHERE contexto = 'EXTRA' AND presupuesto_extra_item_origen_id = ?", Integer.class, itemId)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM repuestos_caso WHERE caso_id = 100", Integer.class)).isZero();

        JsonNode snapshots = json.readTree(mockMvc.perform(get("/api/v1/cases/100/budget-comparisons?context=EXTRA").header("X-User-Id", "3"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(snapshots.size()).isEqualTo(1);
        assertThat(snapshots.get(0).get("id").asLong()).isEqualTo(snapshotId);
        assertThat(snapshots.get(0).get("context").asText()).isEqualTo("EXTRA");

        JsonNode matrix = json.readTree(mockMvc.perform(get("/api/v1/cases/100/budget-comparisons/{snapshotId}", snapshotId).header("X-User-Id", "3"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        long pieceId = matrix.at("/pieces/0/id").asLong();
        JsonNode provider = json.readTree(mockMvc.perform(post("/api/v1/cases/100/budget-comparisons/{snapshotId}/providers", snapshotId).header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"providerId\":20,\"billingCode\":\"A\",\"paymentMethodCode\":\"CONTADO\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        long columnId = provider.at("/providers/0/id").asLong();
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/v1/cases/100/budget-comparisons/{snapshotId}/pieces/{pieceId}/prices/{columnId}", snapshotId, pieceId, columnId).header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amount\":120}"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/cases/100/budget-comparisons/{snapshotId}/pieces/{pieceId}/providers/{columnId}/select", snapshotId, pieceId, columnId).header("X-User-Id", "3"))
                .andExpect(status().isOk());

        assertThat(jdbc.queryForObject("SELECT importe_cotizacion_seleccionada FROM presupuesto_extra_items WHERE id = ?", BigDecimal.class, itemId)).isEqualByComparingTo("120.00");
        assertThat(jdbc.queryForObject("SELECT proveedor_seleccionado_id FROM presupuesto_extra_items WHERE id = ?", Long.class, itemId)).isEqualTo(20L);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM repuestos_caso WHERE caso_id = 100", Integer.class)).isZero();
    }

    @Test
    void readDoesNotAdvanceTheHeaderLockAndOnlyAnActualDraftMutationMakesThePriorLockStale() throws Exception {
        jdbc.update("UPDATE presupuestos_extra SET version_lock = 20 WHERE id = 800");
        String payload = "{\"expectedVersion\":20,\"items\":[{\"visualOrder\":1,\"description\":\"Espejo extra\",\"quantity\":1,\"partUnitAmount\":0,\"laborUnitAmount\":0,\"affectedPiece\":\"Espejo\",\"actionCode\":\"REEMPLAZAR\",\"damageLevelCode\":\"LEVE\",\"partsAmount\":0,\"active\":true}]}";

        JsonNode loaded = json.readTree(mockMvc.perform(get("/api/v1/cases/100/extra-budget").header("X-User-Id", "3"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(loaded.get("versionLock").asLong()).isEqualTo(20L);

        JsonNode saved = json.readTree(mockMvc.perform(put("/api/v1/cases/100/extra-budget/draft").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(saved.get("versionLock").asLong()).isGreaterThan(20L);

        mockMvc.perform(put("/api/v1/cases/100/extra-budget/draft").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EXTRA_BUDGET_VERSION_CONFLICT"))
                .andExpect(jsonPath("$.data.currentVersionLock").value(saved.get("versionLock").asLong()));
    }

    @Test
    void confirmsWithTheLockReturnedByDraftSaveAndRejectsAnActualStaleConfirmation() throws Exception {
        String draftPayload = "{\"expectedVersion\":0,\"items\":[{\"visualOrder\":1,\"description\":\"Espejo extra\",\"quantity\":1,\"partUnitAmount\":0,\"laborUnitAmount\":0,\"affectedPiece\":\"Espejo\",\"actionCode\":\"REPARAR\",\"damageLevelCode\":\"LEVE\",\"partsAmount\":0,\"active\":true}]}";
        JsonNode saved = json.readTree(mockMvc.perform(put("/api/v1/cases/100/extra-budget/draft").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON).content(draftPayload))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        long savedLock = saved.get("versionLock").asLong();

        JsonNode confirmed = json.readTree(mockMvc.perform(post("/api/v1/cases/100/extra-budget/confirm").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":" + savedLock + ",\"confirmation\":\"PENDIENTE\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        long currentLock = confirmed.get("versionLock").asLong();

        mockMvc.perform(post("/api/v1/cases/100/extra-budget/confirm").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":" + savedLock + ",\"confirmation\":\"PENDIENTE\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EXTRA_BUDGET_VERSION_CONFLICT"))
                .andExpect(jsonPath("$.data.currentVersionLock").value(currentLock));
    }

    @Test
    void identifiesEachMissingActiveDraftField() throws Exception {
        mockMvc.perform(put("/api/v1/cases/100/extra-budget/draft").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":0,\"items\":[{\"active\":true,\"actionCode\":\"REEMPLAZAR\",\"damageLevelCode\":\"LEVE\",\"partsAmount\":0}]}"))
                .andExpect(status().isConflict());
    }

    @Test
    void persistsPendingConfirmationWithoutPromotingPartsOrEnablingPayment() throws Exception {
        JsonNode confirmation = json.readTree(mockMvc.perform(post("/api/v1/cases/100/extra-budget/confirm").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":0,\"confirmation\":\"PENDIENTE\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());

        assertThat(confirmation.get("customerConfirmation").asText()).isEqualTo("PENDIENTE");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM repuestos_caso WHERE caso_id = 100", Integer.class)).isZero();
        mockMvc.perform(post("/api/v1/cases/100/extra-budget/payments").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":0,\"amount\":1,\"paymentMethodCode\":\"EFECTIVO\"}"))
                .andExpect(status().isConflict());
    }

    private JsonNode quote(long providerId, String amount) throws Exception {
        return json.readTree(mockMvc.perform(post("/api/v1/cases/100/extra-budget/comparison/quotes").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":0,\"itemId\":900,\"providerId\":" + providerId + ",\"amount\":" + amount + "}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }

    private void select(long providerId) throws Exception {
        mockMvc.perform(post("/api/v1/cases/100/extra-budget/comparison/select").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":0,\"itemId\":900,\"providerId\":" + providerId + "}"))
                .andExpect(status().isOk());
    }
}
