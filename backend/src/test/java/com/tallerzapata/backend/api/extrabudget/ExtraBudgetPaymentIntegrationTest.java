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
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ExtraBudgetPaymentIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private TestDatabaseCleaner cleaner;

    @BeforeEach
    void setUp() {
        cleaner.cleanAll();
        seedBaseData();
    }

    @Test
    void paymentIsForcedToClientAndAnnulmentRestoresOnlyTheExtraLedger() throws Exception {
        JsonNode accepted = createAcceptedExtra();
        JsonNode paid = postJson("/api/v1/cases/100/extra-budget/payments", "{\"expectedVersion\":" + accepted.get("versionLock").asLong() + ",\"amount\":100.00,\"paymentMethodCode\":\"EFECTIVO\"}");
        long paymentMovementId = paid.get("payments").get(0).get("movementId").asLong();
        long paymentVersion = paid.get("versionLock").asLong();

        jdbcTemplate.update("INSERT INTO movimientos_financieros (public_id, caso_id, tipo_movimiento_codigo, origen_flujo_codigo, contraparte_tipo_codigo, contraparte_compania_id, fecha_movimiento, monto_bruto, monto_neto, medio_pago_codigo, es_senia, es_bonificacion, registrado_por) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?)",
                "00000000-0000-0000-0000-000000009001", 100L, "INGRESO", "ASEGURADORA", "COMPANIA", 1L, new BigDecimal("777.00"), new BigDecimal("777.00"), "EFECTIVO", false, false, 3L);

        JsonNode annulled = postJson("/api/v1/cases/100/extra-budget/payments/annul", "{\"expectedVersion\":" + paymentVersion + ",\"movementId\":" + paymentMovementId + "}");
        assertThat(annulled.get("paidAmount").decimalValue()).isEqualByComparingTo("0.00");
        assertThat(annulled.get("balance").decimalValue()).isEqualByComparingTo("100.00");
        assertThat(annulled.get("payments").size()).isEqualTo(2);

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM movimientos_financieros WHERE caso_id = ? AND origen_flujo_codigo = 'CLIENTE' AND contraparte_tipo_codigo = 'PERSONA' AND cancela_tipo_codigo = 'TRABAJOS_EXTRAS'", Integer.class, 100L)).isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM movimientos_financieros WHERE caso_id = ? AND origen_flujo_codigo = 'ASEGURADORA' AND monto_neto = 777.00", Integer.class, 100L)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COALESCE(SUM(monto_aplicado), 0) FROM presupuesto_extra_pago_aplicaciones", BigDecimal.class)).isEqualByComparingTo("0.00");
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM movimiento_aplicaciones", Integer.class)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'anular_pago_presupuesto_extra'", Integer.class, 100L)).isEqualTo(1);

        mockMvc.perform(post("/api/v1/cases/100/extra-budget/payments/annul")
                        .header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":" + paymentVersion + ",\"movementId\":" + paymentMovementId + "}"))
                .andExpect(status().isConflict());
    }

    @Test
    void rejectsOverpaymentStaleCommandsAndUnauthorizedAnnulmentWithoutWritingLedgerRows() throws Exception {
        JsonNode accepted = createAcceptedExtra();
        long version = accepted.get("versionLock").asLong();

        mockMvc.perform(post("/api/v1/cases/100/extra-budget/payments")
                        .header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":" + version + ",\"amount\":121.01,\"paymentMethodCode\":\"EFECTIVO\"}"))
                .andExpect(status().isConflict());
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM presupuesto_extra_pago_aplicaciones", Integer.class)).isZero();

        JsonNode paid = postJson("/api/v1/cases/100/extra-budget/payments", "{\"expectedVersion\":" + version + ",\"amount\":20.00,\"paymentMethodCode\":\"EFECTIVO\"}");
        long movementId = paid.get("payments").get(0).get("movementId").asLong();
        mockMvc.perform(post("/api/v1/cases/100/extra-budget/payments/annul")
                        .header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":" + version + ",\"movementId\":" + movementId + "}"))
                .andExpect(status().isConflict());

        jdbcTemplate.update("INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 4L, "00000000-0000-0000-0000-000000000400", "sin-permiso", "sin-permiso@tallerzapata.local", "hash", "Sin", "Permiso", true);
        mockMvc.perform(post("/api/v1/cases/100/extra-budget/payments/annul")
                        .header("X-User-Id", "4").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":" + paid.get("versionLock").asLong() + ",\"movementId\":" + movementId + "}"))
                .andExpect(status().isForbidden());
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM presupuesto_extra_pago_aplicaciones", Integer.class)).isEqualTo(1);
    }

    @Test
    void particularDoesNotHydrateOrCreateAnExtraBudgetThroughDirectApiCalls() throws Exception {
        jdbcTemplate.update("UPDATE casos SET tipo_tramite_id = (SELECT id FROM tipos_tramite WHERE codigo = 'PARTICULAR') WHERE id = ?", 100L);

        mockMvc.perform(get("/api/v1/cases/100/extra-budget").header("X-User-Id", "3"))
                .andExpect(status().isConflict());
        mockMvc.perform(put("/api/v1/cases/100/extra-budget/draft").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":[{\"visualOrder\":1,\"description\":\"Extra\",\"quantity\":1,\"partUnitAmount\":100,\"laborUnitAmount\":0,\"affectedPiece\":\"Extra\",\"actionCode\":\"REPARAR\",\"damageLevelCode\":\"LEVE\",\"partsAmount\":100}]}"))
                .andExpect(status().isConflict());

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM presupuestos_extra WHERE caso_id = ?", Integer.class, 100L)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM presupuesto_extra_items", Integer.class)).isZero();
    }

    @Test
    void activationCreatesOneEmptyCanonicalItemOnlyWhenTheSupportedCaseHasNoExtraData() throws Exception {
        JsonNode activation = postJson("/api/v1/cases/100/extra-budget/activation", "{\"active\":true}");

        assertThat(activation.get("activation").get("active").asBoolean()).isTrue();
        assertThat(activation.get("versions").get(0).get("items").size()).isEqualTo(1);
        assertThat(activation.get("versions").get(0).get("items").get(0).get("sourceType").asText()).isEqualTo("EXTRA_BUDGET_ITEM");
        assertThat(activation.get("versions").get(0).get("items").get(0).get("sourceId").asLong()).isPositive();
        assertThat(activation.get("versions").get(0).get("items").get(0).get("description").asText()).isEmpty();

        JsonNode repeated = postJson("/api/v1/cases/100/extra-budget/activation", "{\"expectedVersion\":" + activation.get("versionLock").asLong() + ",\"active\":true}");
        assertThat(repeated.get("versions").get(0).get("items").size()).isEqualTo(1);
    }

    @Test
    void savingANewCanonicalDraftItemDefaultsItToActiveBeforeTheIdentityInsert() throws Exception {
        JsonNode draft = putJson("/api/v1/cases/100/extra-budget/draft", "{\"items\":[{\"visualOrder\":1,\"description\":\"Espejo extra\",\"quantity\":1,\"partUnitAmount\":120,\"laborUnitAmount\":0,\"affectedPiece\":\"Espejo\",\"actionCode\":\"REEMPLAZAR\",\"damageLevelCode\":\"LEVE\",\"partsAmount\":120}]}" );

        assertThat(draft.get("versions").get(0).get("items").get(0).get("active").asBoolean()).isTrue();
        assertThat(jdbcTemplate.queryForObject("SELECT activo FROM presupuesto_extra_items", Boolean.class)).isTrue();
    }

    @Test
    void rejectsPaymentsBeforeAcceptanceAndAfterRejectionWithoutWritingLedgerRows() throws Exception {
        JsonNode draft = putJson("/api/v1/cases/100/extra-budget/draft", "{\"items\":[{\"visualOrder\":1,\"description\":\"Extra\",\"quantity\":1,\"partUnitAmount\":100,\"laborUnitAmount\":0,\"affectedPiece\":\"Extra\",\"actionCode\":\"REPARAR\",\"damageLevelCode\":\"LEVE\",\"partsAmount\":100}]}");
        assertPaymentIsRejected(draft.get("versionLock").asLong());

        JsonNode presented = postJson("/api/v1/cases/100/extra-budget/present", "{\"expectedVersion\":" + draft.get("versionLock").asLong() + "}");
        JsonNode rejected = postJson("/api/v1/cases/100/extra-budget/reject", "{\"expectedVersion\":" + presented.get("versionLock").asLong() + ",\"reason\":\"No aprobado\"}");
        assertPaymentIsRejected(rejected.get("versionLock").asLong());

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM presupuesto_extra_pago_aplicaciones", Integer.class)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM movimientos_financieros WHERE caso_id = ?", Integer.class, 100L)).isZero();
    }

    @Test
    void acceptsOnlyOneCommandForTheSameVersionAndRejectsTheStaleCompetitor() throws Exception {
        JsonNode draft = putJson("/api/v1/cases/100/extra-budget/draft", "{\"items\":[{\"visualOrder\":1,\"description\":\"Extra\",\"quantity\":1,\"partUnitAmount\":100,\"laborUnitAmount\":0,\"affectedPiece\":\"Extra\",\"actionCode\":\"REPARAR\",\"damageLevelCode\":\"LEVE\",\"partsAmount\":100}]}");
        JsonNode presented = postJson("/api/v1/cases/100/extra-budget/present", "{\"expectedVersion\":" + draft.get("versionLock").asLong() + "}");
        long expectedVersion = presented.get("versionLock").asLong();

        postJson("/api/v1/cases/100/extra-budget/accept", "{\"expectedVersion\":" + expectedVersion + "}");
        mockMvc.perform(post("/api/v1/cases/100/extra-budget/accept")
                        .header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":" + expectedVersion + "}"))
                .andExpect(status().isConflict());

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM presupuesto_extra_versiones WHERE estado = 'ACEPTADO'", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM presupuesto_extra_eventos WHERE transicion = 'CONFIRMAR_SI'", Integer.class)).isEqualTo(1);
    }

    @Test
    void concurrentAcceptCommandsProduceOneAcceptanceAndOneConflict() throws Exception {
        JsonNode draft = putJson("/api/v1/cases/100/extra-budget/draft", "{\"items\":[{\"visualOrder\":1,\"description\":\"Extra\",\"quantity\":1,\"partUnitAmount\":100,\"laborUnitAmount\":0,\"affectedPiece\":\"Extra\",\"actionCode\":\"REPARAR\",\"damageLevelCode\":\"LEVE\",\"partsAmount\":100}]}");
        JsonNode presented = postJson("/api/v1/cases/100/extra-budget/present", "{\"expectedVersion\":" + draft.get("versionLock").asLong() + "}");
        String body = "{\"expectedVersion\":" + presented.get("versionLock").asLong() + "}";
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            List<Future<Integer>> results = List.of(
                    executor.submit(() -> acceptWhenReleased(start, body)),
                    executor.submit(() -> acceptWhenReleased(start, body))
            );
            start.countDown();

            assertThat(results.stream().map(this::statusOf).toList()).containsExactlyInAnyOrder(200, 409);
        } finally {
            executor.shutdownNow();
        }
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM presupuesto_extra_versiones WHERE estado = 'ACEPTADO'", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM presupuesto_extra_eventos WHERE transicion = 'CONFIRMAR_SI'", Integer.class)).isEqualTo(1);
    }

    @Test
    void rejectsAStalePaymentCommandWithoutCreatingAnotherApplication() throws Exception {
        JsonNode accepted = createAcceptedExtra();
        long expectedVersion = accepted.get("versionLock").asLong();
        postJson("/api/v1/cases/100/extra-budget/payments", "{\"expectedVersion\":" + expectedVersion + ",\"amount\":20.00,\"paymentMethodCode\":\"EFECTIVO\"}");

        assertPaymentIsRejected(expectedVersion);

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM presupuesto_extra_pago_aplicaciones", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM movimientos_financieros WHERE caso_id = ? AND origen_flujo_codigo = 'CLIENTE'", Integer.class, 100L)).isEqualTo(1);
    }

    @Test
    void rejectsNegativeOrMissingDraftAmountsAndQuantityWithoutPersistingItems() throws Exception {
        for (String item : List.of(
                "{\"visualOrder\":1,\"description\":\"Negativo\",\"quantity\":1,\"partUnitAmount\":-1,\"laborUnitAmount\":0}",
                "{\"visualOrder\":1,\"description\":\"Negativo\",\"quantity\":1,\"partUnitAmount\":0,\"laborUnitAmount\":-1}",
                "{\"visualOrder\":1,\"description\":\"Cantidad\",\"quantity\":-1,\"partUnitAmount\":0,\"laborUnitAmount\":0}",
                "{\"visualOrder\":1,\"description\":\"Vacío\",\"quantity\":1,\"partUnitAmount\":null,\"laborUnitAmount\":0}")) {
            mockMvc.perform(put("/api/v1/cases/100/extra-budget/draft").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON).content("{\"items\":[" + item + "]}"))
                    .andExpect(status().isConflict());
        }
        mockMvc.perform(put("/api/v1/cases/100/extra-budget/draft").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":[{\"visualOrder\":1,\"description\":\"No finito\",\"quantity\":1,\"partUnitAmount\":\"NaN\",\"laborUnitAmount\":0}]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El cuerpo de la solicitud contiene valores inválidos"));
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM presupuesto_extra_items", Integer.class)).isZero();
    }

    @Test
    void extraPaymentsDoNotReduceTheMainCustomerBalanceSummary() throws Exception {
        JsonNode accepted = createAcceptedExtra();
        postJson("/api/v1/cases/100/extra-budget/payments", "{\"expectedVersion\":" + accepted.get("versionLock").asLong() + ",\"amount\":50.00,\"paymentMethodCode\":\"EFECTIVO\"}");

        mockMvc.perform(get("/api/v1/cases/100/finance/particular-summary").header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.customerPaid").value(0))
                .andExpect(jsonPath("$.pendingBalance").value(0));
    }

    @Test
    void paymentPersistsTheExistingReceiptReferenceAndModalMetadata() throws Exception {
        JsonNode accepted = createAcceptedExtra();
        jdbcTemplate.update("INSERT INTO comprobantes_emitidos (public_id, caso_id, tipo_comprobante_codigo, numero_comprobante, razon_social_receptor, fecha_emision, neto_gravado, iva, total) VALUES (?, ?, ?, ?, ?, CURRENT_DATE, ?, ?, ?)",
                "00000000-0000-0000-0000-000000007100", 100L, "RECIBO", "R-100", "Carlos Cliente", new BigDecimal("100.00"), BigDecimal.ZERO, new BigDecimal("100.00"));
        Long receiptId = jdbcTemplate.queryForObject("SELECT id FROM comprobantes_emitidos WHERE caso_id = ?", Long.class, 100L);

        postJson("/api/v1/cases/100/extra-budget/payments", "{\"expectedVersion\":" + accepted.get("versionLock").asLong() + ",\"amount\":20.00,\"movementAt\":\"2026-08-24T14:30:00\",\"paymentMethodCode\":\"EFECTIVO\",\"receiptId\":" + receiptId + ",\"externalReference\":\"OP-42\",\"reason\":\"Pago parcial extra\"}");

        assertThat(jdbcTemplate.queryForObject("SELECT comprobante_id FROM movimientos_financieros WHERE caso_id = ?", Long.class, 100L)).isEqualTo(receiptId);
        assertThat(jdbcTemplate.queryForObject("SELECT referencia_externa FROM movimientos_financieros WHERE caso_id = ?", String.class, 100L)).isEqualTo("OP-42");
        assertThat(jdbcTemplate.queryForObject("SELECT motivo FROM movimientos_financieros WHERE caso_id = ?", String.class, 100L)).isEqualTo("Pago parcial extra");
    }

    @Test
    void rejectsPresentationOfADraftWithoutAPositiveNormalizedLineOrPdfSnapshot() throws Exception {
        JsonNode draft = putJson("/api/v1/cases/100/extra-budget/draft", "{\"items\":[{\"visualOrder\":1,\"description\":\"Sin valor\",\"quantity\":1,\"partUnitAmount\":0.004,\"laborUnitAmount\":0.004,\"affectedPiece\":\"Sin valor\",\"actionCode\":\"REPARAR\",\"damageLevelCode\":\"LEVE\",\"partsAmount\":0}]}");

        mockMvc.perform(post("/api/v1/cases/100/extra-budget/present")
                        .header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":" + draft.get("versionLock").asLong() + "}"))
                .andExpect(status().isConflict());

        assertThat(jdbcTemplate.queryForObject("SELECT estado FROM presupuesto_extra_versiones", String.class)).isEqualTo("BORRADOR");
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM presupuesto_extra_versiones WHERE pdf_snapshot_json IS NOT NULL", Integer.class)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM presupuesto_extra_eventos WHERE transicion = 'PRESENTADO'", Integer.class)).isZero();
    }

    @Test
    void presentationFreezesOnlyPositiveLinesAndKeepsHistoricalVersionAvailableAfterRevision() throws Exception {
        JsonNode draft = putJson("/api/v1/cases/100/extra-budget/draft", "{\"items\":[{\"visualOrder\":1,\"description\":\"Incluida\",\"quantity\":1,\"partUnitAmount\":100,\"laborUnitAmount\":0,\"affectedPiece\":\"Incluida\",\"actionCode\":\"REEMPLAZAR\",\"damageLevelCode\":\"LEVE\",\"partsAmount\":100},{\"visualOrder\":2,\"description\":\"Omitida\",\"quantity\":1,\"partUnitAmount\":0,\"laborUnitAmount\":0,\"affectedPiece\":\"Omitida\",\"actionCode\":\"REPARAR\",\"damageLevelCode\":\"LEVE\",\"partsAmount\":0}]}");
        JsonNode presented = postJson("/api/v1/cases/100/extra-budget/present", "{\"expectedVersion\":" + draft.get("versionLock").asLong() + "}");

        assertThat(jdbcTemplate.queryForObject("SELECT pdf_snapshot_json FROM presupuesto_extra_versiones WHERE numero_version = 1", String.class))
                .contains("Incluida").doesNotContain("Omitida");

        JsonNode accepted = postJson("/api/v1/cases/100/extra-budget/accept", "{\"expectedVersion\":" + presented.get("versionLock").asLong() + "}");
        JsonNode revised = postJson("/api/v1/cases/100/extra-budget/revise", "{\"expectedVersion\":" + accepted.get("versionLock").asLong() + "}");

        assertThat(revised.get("versions").size()).isEqualTo(2);
        assertThat(revised.get("versions").get(0).get("status").asText()).isEqualTo("ACEPTADO");
        assertThat(revised.get("versions").get(0).get("pdfAvailable").asBoolean()).isTrue();
        assertThat(revised.get("versions").get(0).get("items").size()).isEqualTo(2);
        assertThat(revised.get("versions").get(1).get("status").asText()).isEqualTo("BORRADOR");

        mockMvc.perform(get("/api/v1/cases/100/extra-budget/versions/1/pdf").header("X-User-Id", "3"))
                .andExpect(status().isOk());
    }

    private void assertPaymentIsRejected(long expectedVersion) throws Exception {
        mockMvc.perform(post("/api/v1/cases/100/extra-budget/payments")
                        .header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":" + expectedVersion + ",\"amount\":10.00,\"paymentMethodCode\":\"EFECTIVO\"}"))
                .andExpect(status().isConflict());
    }

    private int acceptWhenReleased(CountDownLatch start, String body) throws Exception {
        start.await();
        return mockMvc.perform(post("/api/v1/cases/100/extra-budget/accept")
                        .header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON).content(body))
                .andReturn().getResponse().getStatus();
    }

    private int statusOf(Future<Integer> result) {
        try {
            return result.get();
        } catch (Exception exception) {
            throw new AssertionError("La aceptación concurrente no completó", exception);
        }
    }

    private JsonNode createAcceptedExtra() throws Exception {
        JsonNode draft = putJson("/api/v1/cases/100/extra-budget/draft", "{\"items\":[{\"visualOrder\":1,\"description\":\"Mano de obra extra\",\"quantity\":1,\"partUnitAmount\":100,\"laborUnitAmount\":0,\"affectedPiece\":\"Mano de obra\",\"actionCode\":\"REPARAR\",\"damageLevelCode\":\"LEVE\",\"partsAmount\":100}]}");
        JsonNode presented = postJson("/api/v1/cases/100/extra-budget/present", "{\"expectedVersion\":" + draft.get("versionLock").asLong() + "}");
        return postJson("/api/v1/cases/100/extra-budget/accept", "{\"expectedVersion\":" + presented.get("versionLock").asLong() + "}");
    }

    private JsonNode postJson(String path, String body) throws Exception {
        MvcResult result = mockMvc.perform(post(path).header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private JsonNode putJson(String path, String body) throws Exception {
        MvcResult result = mockMvc.perform(put(path).header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private void seedBaseData() {
        jdbcTemplate.update("INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 3L, "00000000-0000-0000-0000-000000000300", "operador", "operador@tallerzapata.local", "hash", "Olivia", "Operadora", true);
        jdbcTemplate.update("INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (?, ?, ?, ?, ?, ?)", 3L, 3L, 2L, 1L, 1L, true);
        jdbcTemplate.update("INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 10L, "00000000-0000-0000-0000-000000001010", "fisica", "Carlos", "Cliente", "Carlos Cliente", "DNI", "30111222", "30111222", true);
        jdbcTemplate.update("INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (?, ?, ?, ?, ?)", 10L, "00000000-0000-0000-0000-000000002010", "AB123CD", "AB123CD", true);
        jdbcTemplate.update("INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 100L, "00000000-0000-0000-0000-000000003100", "0100PZ", 100L, 2L, 1L, 1L, 10L, 10L, false, 1L, 1L, 4L, 7L, 9L, 11L, "MEDIA");
        jdbcTemplate.update("INSERT INTO caso_personas (id, caso_id, persona_id, rol_caso_codigo, vehiculo_id, es_principal, notas) VALUES (?, ?, ?, ?, ?, ?, ?)", 1L, 100L, 10L, "CLIENTE", null, true, null);
        jdbcTemplate.update("MERGE INTO companias_seguro (id, public_id, codigo, nombre, cuit, requiere_fotos_reparado, dias_pago_esperados, activo) KEY(id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 1L, "00000000-0000-0000-0000-000000004001", "SANCOR", "Sancor Seguros", "30-12345678-9", false, 30, true);
    }
}
