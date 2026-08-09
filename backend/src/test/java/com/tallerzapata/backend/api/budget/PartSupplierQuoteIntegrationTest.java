package com.tallerzapata.backend.api.budget;

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
import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PartSupplierQuoteIntegrationTest {

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
    void shouldCreateAndListQuotes() throws Exception {
        // Create a budget so we can add a part
        mockMvc.perform(put("/api/v1/cases/100/budget")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new BudgetUpsertRequest(
                                LocalDate.of(2026, 4, 20), "BORRADOR",
                                new BigDecimal("1000.00"), new BigDecimal("21.00"),
                                 new BigDecimal("500.00"), 5, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
                                 null, null, null, null
                        ))))
                .andExpect(status().isOk());

        // Create a part
        mockMvc.perform(post("/api/v1/cases/100/parts")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CasePartCreateRequest(
                                null, "Paragolpes delantero", null, null, null,
                                "PENDIENTE", null, null,
                                new BigDecimal("300.00"), null, null, false, false
                        ))))
                .andExpect(status().isOk());

        // Find the part ID
        Long partId = jdbcTemplate.queryForObject("SELECT id FROM repuestos_caso WHERE caso_id = 100 ORDER BY id ASC LIMIT 1", Long.class);

        // Create a quote
        mockMvc.perform(post("/api/v1/cases/100/parts/" + partId + "/quotes")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new PartSupplierQuoteCreateRequest(
                                "Repuestos SA", new BigDecimal("250.00"), "A", "CONTADO"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.supplier").value("Repuestos SA"))
                .andExpect(jsonPath("$.amount").value(250.00))
                .andExpect(jsonPath("$.billingCode").value("A"))
                .andExpect(jsonPath("$.paymentMethodCode").value("CONTADO"));

        // Create another quote
        mockMvc.perform(post("/api/v1/cases/100/parts/" + partId + "/quotes")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new PartSupplierQuoteCreateRequest(
                                "Autopartes SRL", new BigDecimal("280.00"), "C", "TRANSFERENCIA"
                        ))))
                .andExpect(status().isOk());

        // List quotes
        mockMvc.perform(get("/api/v1/cases/100/parts/" + partId + "/quotes")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].amount").value(250.00))
                .andExpect(jsonPath("$[1].amount").value(280.00));
    }

    @Test
    void shouldGetBestSubtotal() throws Exception {
        // Create budget + 2 parts + quotes on each
        mockMvc.perform(put("/api/v1/cases/100/budget")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new BudgetUpsertRequest(
                                LocalDate.of(2026, 4, 20), "BORRADOR",
                                new BigDecimal("1000.00"), new BigDecimal("21.00"),
                                 new BigDecimal("500.00"), 5, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
                                 null, null, null, null
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/cases/100/parts")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CasePartCreateRequest(
                                null, "Faro izquierdo", null, null, null,
                                "PENDIENTE", null, null,
                                new BigDecimal("400.00"), null, null, false, false
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/cases/100/parts")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CasePartCreateRequest(
                                null, "Faro derecho", null, null, null,
                                "PENDIENTE", null, null,
                                new BigDecimal("500.00"), null, null, false, false
                        ))))
                .andExpect(status().isOk());

        Long part1Id = jdbcTemplate.queryForObject("SELECT id FROM repuestos_caso WHERE caso_id = 100 AND descripcion = 'Faro izquierdo' ORDER BY id ASC LIMIT 1", Long.class);
        Long part2Id = jdbcTemplate.queryForObject("SELECT id FROM repuestos_caso WHERE caso_id = 100 AND descripcion = 'Faro derecho' ORDER BY id ASC LIMIT 1", Long.class);

        // Quote part1
        mockMvc.perform(post("/api/v1/cases/100/parts/" + part1Id + "/quotes")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new PartSupplierQuoteCreateRequest(
                                "Prov A", new BigDecimal("350.00"), "A", "CONTADO"
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/cases/100/parts/" + part1Id + "/quotes")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new PartSupplierQuoteCreateRequest(
                                "Prov B", new BigDecimal("320.00"), "C", "TRANSFERENCIA"
                        ))))
                .andExpect(status().isOk());

        // Quote part2
        mockMvc.perform(post("/api/v1/cases/100/parts/" + part2Id + "/quotes")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new PartSupplierQuoteCreateRequest(
                                "Prov A", new BigDecimal("480.00"), "A", "CONTADO"
                        ))))
                .andExpect(status().isOk());

        // Best subtotal: min(320, 350) + min(480) = 320 + 480 = 800
        mockMvc.perform(get("/api/v1/cases/100/parts/quotes/best-subtotal")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bestSubtotal").value(800.0))
                .andExpect(jsonPath("$.partsWithQuotes").value(2))
                .andExpect(jsonPath("$.partsWithoutQuotes").value(0));
    }

    @Test
    void shouldDeleteQuote() throws Exception {
        mockMvc.perform(put("/api/v1/cases/100/budget")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new BudgetUpsertRequest(
                                LocalDate.of(2026, 4, 20), "BORRADOR",
                                new BigDecimal("1000.00"), new BigDecimal("21.00"),
                                 new BigDecimal("500.00"), 5, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
                                 null, null, null, null
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/cases/100/parts")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CasePartCreateRequest(
                                null, "Paragolpes", null, null, null,
                                "PENDIENTE", null, null,
                                new BigDecimal("300.00"), null, null, false, false
                        ))))
                .andExpect(status().isOk());

        Long partId = jdbcTemplate.queryForObject("SELECT id FROM repuestos_caso WHERE caso_id = 100 ORDER BY id ASC LIMIT 1", Long.class);

        String response = mockMvc.perform(post("/api/v1/cases/100/parts/" + partId + "/quotes")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new PartSupplierQuoteCreateRequest(
                                "Prov X", new BigDecimal("100.00"), "A", "CONTADO"
                        ))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long quoteId = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(delete("/api/v1/cases/100/parts/" + partId + "/quotes/" + quoteId)
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/cases/100/parts/" + partId + "/quotes")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void shouldRejectInvalidCatalogCodes() throws Exception {
        mockMvc.perform(put("/api/v1/cases/100/budget")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new BudgetUpsertRequest(
                                LocalDate.of(2026, 4, 20), "BORRADOR",
                                new BigDecimal("1000.00"), new BigDecimal("21.00"),
                                 new BigDecimal("500.00"), 5, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
                                 null, null, null, null
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/cases/100/parts")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CasePartCreateRequest(
                                null, "Paragolpes", null, null, null,
                                "PENDIENTE", null, null,
                                new BigDecimal("300.00"), null, null, false, false
                        ))))
                .andExpect(status().isOk());

        Long partId = jdbcTemplate.queryForObject("SELECT id FROM repuestos_caso WHERE caso_id = 100 ORDER BY id ASC LIMIT 1", Long.class);

        mockMvc.perform(post("/api/v1/cases/100/parts/" + partId + "/quotes")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new PartSupplierQuoteCreateRequest(
                                "Prov", new BigDecimal("100.00"), "INEXISTENTE", "CONTADO"
                        ))))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldReturn404ForNonExistentCase() throws Exception {
        mockMvc.perform(get("/api/v1/cases/99999/parts/1/quotes")
                        .header("X-User-Id", "3"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturn404ForNonExistentPart() throws Exception {
        mockMvc.perform(get("/api/v1/cases/100/parts/99999/quotes")
                        .header("X-User-Id", "3"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldRejectNegativeAmount() throws Exception {
        mockMvc.perform(put("/api/v1/cases/100/budget")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new BudgetUpsertRequest(
                                LocalDate.of(2026, 4, 20), "BORRADOR",
                                new BigDecimal("1000.00"), new BigDecimal("21.00"),
                                 new BigDecimal("500.00"), 5, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
                                 null, null, null, null
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/cases/100/parts")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CasePartCreateRequest(
                                null, "Paragolpes", null, null, null,
                                "PENDIENTE", null, null,
                                new BigDecimal("300.00"), null, null, false, false
                        ))))
                .andExpect(status().isOk());

        Long partId = jdbcTemplate.queryForObject("SELECT id FROM repuestos_caso WHERE caso_id = 100 ORDER BY id ASC LIMIT 1", Long.class);

        mockMvc.perform(post("/api/v1/cases/100/parts/" + partId + "/quotes")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new PartSupplierQuoteCreateRequest(
                                "Prov", new BigDecimal("-500.00"), "A", "CONTADO"
                        ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldGetCatalogs() throws Exception {
        mockMvc.perform(get("/api/v1/budget/quote-catalogs")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.billingTypes.length()").value(3))
                .andExpect(jsonPath("$.paymentMethods.length()").value(4));
    }

    @Test
    void shouldReturnUnauthorizedForCatalogsWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/v1/budget/quote-catalogs"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldGetBestSubtotalWithPartsWithoutQuotes() throws Exception {
        mockMvc.perform(put("/api/v1/cases/100/budget")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new BudgetUpsertRequest(
                                LocalDate.of(2026, 4, 20), "BORRADOR",
                                new BigDecimal("1000.00"), new BigDecimal("21.00"),
                                 new BigDecimal("500.00"), 5, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
                                 null, null, null, null
                        ))))
                .andExpect(status().isOk());

        // Create a part without adding quotes
        mockMvc.perform(post("/api/v1/cases/100/parts")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CasePartCreateRequest(
                                null, "Paragolpes", null, null, null,
                                "PENDIENTE", null, null,
                                new BigDecimal("300.00"), null, null, false, false
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/cases/100/parts/quotes/best-subtotal")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bestSubtotal").value(0.0))
                .andExpect(jsonPath("$.partsWithQuotes").value(0))
                .andExpect(jsonPath("$.partsWithoutQuotes").value(1));
    }

    // ── Sync from budget + delete tests ──────────────────────────

    @Test
    void shouldSyncPartsFromBudget() throws Exception {
        // Create budget with items that have REEMPLAZAR decision
        mockMvc.perform(put("/api/v1/cases/100/budget")
                        .header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"budgetDate\":\"2026-01-01\",\"reportStatusCode\":\"BORRADOR\",\"laborWithoutVat\":100000,\"vatRate\":21,\"partsTotal\":50000,\"estimatedDays\":2,\"items\":[{\"visualOrder\":1,\"affectedPiece\":\"Puerta\",\"taskCode\":\"CHAPA\",\"damageLevelCode\":\"LEVE\",\"partDecisionCode\":\"REEMPLAZAR\",\"actionCode\":\"REEMPLAZAR\",\"requiresReplacement\":true,\"partValue\":50000,\"estimatedHours\":2,\"laborAmount\":100000,\"active\":true}]}"))
                .andExpect(status().isOk());

        // Sync parts from budget
        mockMvc.perform(post("/api/v1/cases/100/parts/sync-from-budget")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk());

        // Verify parts exist
        mockMvc.perform(get("/api/v1/cases/100/parts")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].description").value("Puerta"))
                .andExpect(jsonPath("$[0].budgetedPrice").value(50000));
    }

    @Test
    void shouldDeletePartWithoutAffectingBudget() throws Exception {
        // Create a part
        String createResult = mockMvc.perform(post("/api/v1/cases/100/parts")
                        .header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"description\":\"Espejo\",\"statusCode\":\"PENDIENTE\",\"purchasedByCode\":\"TALLER\",\"budgetedPrice\":10000,\"finalPrice\":10000,\"used\":false,\"returned\":false}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Long partId = objectMapper.readTree(createResult).get("id").asLong();

        // Delete the part
        mockMvc.perform(delete("/api/v1/cases/100/parts/{partId}", partId)
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk());

        // Verify deleted
        mockMvc.perform(get("/api/v1/cases/100/parts")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void shouldReturn404WhenDeletingNonExistentPart() throws Exception {
        mockMvc.perform(delete("/api/v1/cases/100/parts/99999")
                        .header("X-User-Id", "3"))
                .andExpect(status().isNotFound());
    }

    private void seedBaseData() {
        jdbcTemplate.update("INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 3L, "00000000-0000-0000-0000-000000000300", "operador", "operador@tallerzapata.local", "hash", "Olivia", "Operadora", true);
        jdbcTemplate.update("INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (?, ?, ?, ?, ?, ?)", 3L, 3L, 2L, 1L, 1L, true);
        jdbcTemplate.update("INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 10L, "00000000-0000-0000-0000-000000001010", "fisica", "Carlos", "Cliente", "Carlos Cliente", "DNI", "30111222", "30111222", true);
        jdbcTemplate.update("INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (?, ?, ?, ?, ?)", 10L, "00000000-0000-0000-0000-000000002010", "AB123CD", "AB123CD", true);
        jdbcTemplate.update("INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 100L, "00000000-0000-0000-0000-000000003100", "0100PZ", 100L, 1L, 1L, 1L, 10L, 10L, false, 1L, 1L, 4L, 7L, 9L, 11L, "MEDIA");
        jdbcTemplate.update("INSERT INTO caso_personas (id, caso_id, persona_id, rol_caso_codigo, vehiculo_id, es_principal, notas) VALUES (?, ?, ?, ?, ?, ?, ?)", 1L, 100L, 10L, "CLIENTE", null, true, null);
    }
}
