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
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BudgetIntegrationTest {

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
    void shouldUpsertBudget() throws Exception {
        mockMvc.perform(put("/api/v1/cases/100/budget")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new BudgetUpsertRequest(
                                LocalDate.of(2026, 4, 20),
                                "BORRADOR",
                                new BigDecimal("1000.00"),
                                new BigDecimal("21.00"),
                                 new BigDecimal("500.00"),
                                 5,
                                 new BigDecimal("2000.00"),
                                 "Observaciones iniciales",
                                 null, null, null, null, null, null, null, null, null, null, null, null,
                                 null, null, null, null
                         ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caseId").value(100))
                .andExpect(jsonPath("$.reportStatusCode").value("BORRADOR"))
                .andExpect(jsonPath("$.laborWithoutVat").value(1000.00))
                .andExpect(jsonPath("$.vatRate").value(21.00))
                .andExpect(jsonPath("$.laborVat").value(210.00))
                .andExpect(jsonPath("$.laborWithVat").value(1210.00))
                .andExpect(jsonPath("$.partsTotal").value(500.00))
                .andExpect(jsonPath("$.totalQuoted").value(1710.00))
                .andExpect(jsonPath("$.currentVersion").value(1));

        Integer auditCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'upsert_presupuesto'",
                Integer.class, 100L);
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void shouldCreateAndListBudgetItems() throws Exception {
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

        mockMvc.perform(post("/api/v1/cases/100/budget/items")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new BudgetItemCreateRequest(
                                1, "Paragolpes delantero", "CHAPA", "MEDIO",
                                "REPARAR", "REPARAR", false,
                                new BigDecimal("0.00"), new BigDecimal("3.50"), new BigDecimal("350.00")
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.affectedPiece").value("Paragolpes delantero"))
                .andExpect(jsonPath("$.taskCode").value("CHAPA"));

        mockMvc.perform(get("/api/v1/cases/100/budget/items")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].taskCode").value("CHAPA"));

        Integer auditCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'crear_presupuesto_item'",
                Integer.class, 100L);
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void shouldUpdateBudgetItem() throws Exception {
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

        String itemResponse = mockMvc.perform(post("/api/v1/cases/100/budget/items")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new BudgetItemCreateRequest(
                                1, "Paragolpes delantero", "CHAPA", "MEDIO",
                                "REPARAR", "REPARAR", false,
                                new BigDecimal("0.00"), new BigDecimal("3.50"), new BigDecimal("350.00")
                        ))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long itemId = objectMapper.readTree(itemResponse).get("id").asLong();

        mockMvc.perform(put("/api/v1/cases/100/budget/items/{itemId}", itemId)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new BudgetItemUpdateRequest(
                                1, "Paragolpes trasero", "PINTURA", "LEVE",
                                "PULIR", "REPARAR", false,
                                new BigDecimal("0.00"), new BigDecimal("2.00"), new BigDecimal("200.00"),
                                true
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.affectedPiece").value("Paragolpes trasero"))
                .andExpect(jsonPath("$.taskCode").value("PINTURA"));

        Integer auditCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'actualizar_presupuesto_item'",
                Integer.class, 100L);
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void shouldCloseBudget() throws Exception {
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

        mockMvc.perform(post("/api/v1/cases/100/budget/close")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new BudgetCloseRequest("CERRADO", "Presupuesto cerrado"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reportStatusCode").value("CERRADO"))
                .andExpect(jsonPath("$.observations").value("Presupuesto cerrado"));

        Integer auditCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'cerrar_presupuesto'",
                Integer.class, 100L);
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void shouldCreateAndListCaseParts() throws Exception {
        mockMvc.perform(post("/api/v1/cases/100/parts")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CasePartCreateRequest(
                                null, "Faro delantero izquierdo", "FARO-001", "Proveedor A",
                                "AUTORIZADO", "PEDIDO", "TALLER", "PENDIENTE",
                                new BigDecimal("150.00"), new BigDecimal("160.00"),
                                null, false, false
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Faro delantero izquierdo"))
                .andExpect(jsonPath("$.statusCode").value("PEDIDO"));

        mockMvc.perform(get("/api/v1/cases/100/parts")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].description").value("Faro delantero izquierdo"));

        Integer auditCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'crear_repuesto_caso'",
                Integer.class, 100L);
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void shouldUpdateCasePart() throws Exception {
        String partResponse = mockMvc.perform(post("/api/v1/cases/100/parts")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CasePartCreateRequest(
                                null, "Faro delantero izquierdo", "FARO-001", "Proveedor A",
                                "AUTORIZADO", "PEDIDO", "TALLER", "PENDIENTE",
                                new BigDecimal("150.00"), new BigDecimal("160.00"),
                                null, false, false
                        ))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long partId = objectMapper.readTree(partResponse).get("id").asLong();

        mockMvc.perform(put("/api/v1/cases/100/parts/{partId}", partId)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CasePartUpdateRequest(
                                null, "Faro delantero derecho", "FARO-002", "Proveedor B",
                                "PENDIENTE", "EN_CAMINO", "COMPANIA", "PAGADO",
                                new BigDecimal("180.00"), new BigDecimal("190.00"),
                                LocalDate.of(2026, 5, 1), true, false
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Faro delantero derecho"))
                .andExpect(jsonPath("$.statusCode").value("EN_CAMINO"))
                .andExpect(jsonPath("$.used").value(true));

        Integer auditCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'actualizar_repuesto_caso'",
                Integer.class, 100L);
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void shouldRejectInvalidCatalogCode() throws Exception {
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

        mockMvc.perform(post("/api/v1/cases/100/budget/items")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new BudgetItemCreateRequest(
                                1, "Paragolpes", "INVALIDO", "MEDIO",
                                "REPARAR", "REPARAR", false,
                                new BigDecimal("0.00"), new BigDecimal("3.50"), new BigDecimal("350.00")
                        ))))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldGeneratePdfWhenBudgetIsClosed() throws Exception {
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

        mockMvc.perform(post("/api/v1/cases/100/budget/items")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new BudgetItemCreateRequest(
                                1, "Paragolpes delantero", "CHAPA", "MEDIO",
                                "REPARAR", "REPARAR", false,
                                new BigDecimal("0.00"), new BigDecimal("3.50"), new BigDecimal("350.00")
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/cases/100/budget/close")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new BudgetCloseRequest("CERRADO", null))))
                .andExpect(status().isOk());

        var result = mockMvc.perform(get("/api/v1/cases/100/budget/pdf")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andExpect(header().string("Content-Disposition", containsString("inline")))
                .andExpect(header().exists("Content-Length"))
                .andReturn();

        assertThat(result.getResponse().getContentAsByteArray().length).isGreaterThan(500);
    }

    @Test
    void shouldGeneratePdfWithMultipleItems() throws Exception {
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

        mockMvc.perform(post("/api/v1/cases/100/budget/items")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new BudgetItemCreateRequest(
                                1, "Paragolpes", "CHAPA", "MEDIO", "REPARAR", "REPARAR", false,
                                new BigDecimal("0.00"), new BigDecimal("3.50"), new BigDecimal("350.00")
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/cases/100/budget/items")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new BudgetItemCreateRequest(
                                2, "Optica", "ELECTRICIDAD", "LEVE", "REEMPLAZAR", "REEMPLAZAR", true,
                                new BigDecimal("800.00"), new BigDecimal("1.00"), new BigDecimal("100.00")
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/cases/100/budget/close")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new BudgetCloseRequest("CERRADO", null))))
                .andExpect(status().isOk());

        var result = mockMvc.perform(get("/api/v1/cases/100/budget/pdf")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andReturn();

        assertThat(result.getResponse().getContentAsByteArray().length).isGreaterThan(800);
    }

    @Test
    void shouldGeneratePdfWhenNoActiveItems() throws Exception {
        mockMvc.perform(put("/api/v1/cases/100/budget")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new BudgetUpsertRequest(
                                LocalDate.of(2026, 4, 20), "BORRADOR",
                                new BigDecimal("1000.00"), new BigDecimal("21.00"),
                                 new BigDecimal("0.00"), 3, null, "Sin items", null, null, null, null, null, null, null, null, null, null, null, null,
                                 null, null, null, null
                         ))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/cases/100/budget/close")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new BudgetCloseRequest("CERRADO", null))))
                .andExpect(status().isOk());

        var result = mockMvc.perform(get("/api/v1/cases/100/budget/pdf")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andReturn();

        assertThat(result.getResponse().getContentAsByteArray().length).isGreaterThan(300);
    }

    @Test
    void shouldRejectPdfWhenUserLacksPermission() throws Exception {
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

        mockMvc.perform(post("/api/v1/cases/100/budget/close")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new BudgetCloseRequest("CERRADO", null))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/cases/100/budget/pdf")
                        .header("X-User-Id", "999"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectPdfWhenBudgetNotClosed() throws Exception {
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

        mockMvc.perform(get("/api/v1/cases/100/budget/pdf")
                        .header("X-User-Id", "3"))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldReturn404WhenNoBudget() throws Exception {
        mockMvc.perform(get("/api/v1/cases/100/budget/pdf")
                        .header("X-User-Id", "3"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldPersistAndReloadAccessoryWorksWithoutChangingBudgetTotals() throws Exception {
        mockMvc.perform(put("/api/v1/cases/100/budget")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"budgetDate\":\"2026-04-20\",\"reportStatusCode\":\"BORRADOR\",\"laborWithoutVat\":1000,\"vatRate\":21,\"partsTotal\":500,\"accessoryWorks\":[{\"affectedPiece\":\"Moldura lateral\",\"actionCode\":\"REEMPLAZAR_Y_PINTAR\",\"damageLevelCode\":\"LEVE\",\"replacementAmount\":30000}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.partsTotal").value(500))
                .andExpect(jsonPath("$.totalQuoted").value(1710))
                .andExpect(jsonPath("$.accessoryWorks[0].affectedPiece").value("Moldura lateral"))
                .andExpect(jsonPath("$.accessoryWorks[0].replacementAmount").value(30000));

        mockMvc.perform(get("/api/v1/cases/100/budget").header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessoryWorks.length()").value(1))
                .andExpect(jsonPath("$.accessoryWorks[0].actionCode").value("REEMPLAZAR_Y_PINTAR"))
                .andExpect(jsonPath("$.accessoryWorks[0].damageLevelCode").value("LEVE"));

        assertThat(jdbcTemplate.queryForObject("SELECT monto_repuestos FROM presupuesto_trabajos_extras", BigDecimal.class))
                .isEqualByComparingTo("30000.00");
    }

    @Test
    void shouldStoreProviderSnapshotsAndAllowFreeTextForBudgetAndParts() throws Exception {
        jdbcTemplate.update("INSERT INTO proveedores (id, public_id, nombre, activo) VALUES (?, ?, ?, ?)", 700L, "00000000-0000-0000-0000-000000007000", "Proveedor Original", true);

        mockMvc.perform(put("/api/v1/cases/100/budget")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"budgetDate\":\"2026-04-20\",\"reportStatusCode\":\"BORRADOR\",\"laborWithoutVat\":1000,\"vatRate\":21,\"partsTotal\":500,\"providerId\":700,\"quotedPartsSupplier\":\"Ignorado\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.providerId").value(700))
                .andExpect(jsonPath("$.quotedPartsSupplier").value("Proveedor Original"));

        mockMvc.perform(post("/api/v1/cases/100/parts")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"description\":\"Optica\",\"finalSupplier\":\"Ignorado\",\"providerId\":700,\"statusCode\":\"PENDIENTE\",\"budgetedPrice\":150,\"used\":false,\"returned\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.providerId").value(700))
                .andExpect(jsonPath("$.finalSupplier").value("Proveedor Original"));

        jdbcTemplate.update("UPDATE proveedores SET nombre = ? WHERE id = ?", "Proveedor Renombrado", 700L);
        mockMvc.perform(get("/api/v1/cases/100/budget").header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quotedPartsSupplier").value("Proveedor Original"));

        mockMvc.perform(post("/api/v1/cases/100/parts")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"description\":\"Espejo\",\"finalSupplier\":\"Proveedor Libre\",\"statusCode\":\"PENDIENTE\",\"budgetedPrice\":150,\"used\":false,\"returned\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.providerId").doesNotExist())
                .andExpect(jsonPath("$.finalSupplier").value("Proveedor Libre"));
    }

    @Test
    void shouldRejectInactiveProviderForBudgetAndParts() throws Exception {
        jdbcTemplate.update("INSERT INTO proveedores (id, public_id, nombre, activo) VALUES (?, ?, ?, ?)", 701L, "00000000-0000-0000-0000-000000007001", "Proveedor Inactivo", false);

        mockMvc.perform(put("/api/v1/cases/100/budget")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"budgetDate\":\"2026-04-20\",\"reportStatusCode\":\"BORRADOR\",\"laborWithoutVat\":1000,\"vatRate\":21,\"partsTotal\":500,\"providerId\":701}"))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/v1/cases/100/parts")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"description\":\"Optica\",\"providerId\":701,\"statusCode\":\"PENDIENTE\",\"budgetedPrice\":150,\"used\":false,\"returned\":false}"))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldCreateAnAtomicIdempotentComparisonSnapshotWithAllEligibleActions() throws Exception {
        List<BudgetItemCreateRequest> items = List.of(
                comparisonItem(1, "Verificar", "A_VERIFICAR", 100),
                comparisonItem(2, "Reemplazar", "REEMPLAZAR", 200),
                comparisonItem(3, "Cargar", "REEMPLAZAR_Y_CARGAR", 300),
                comparisonItem(4, "Pintar", "REEMPLAZAR_Y_PINTAR", 400),
                comparisonItem(5, "No comparable", "REPARAR", 500));

        String response = generateComparison("comparison-key-1", items);
        Long snapshotId = objectMapper.readTree(response).path("comparisonSnapshot").path("id").asLong();
        generateComparison("comparison-key-1", items);

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM comparacion_presupuesto_snapshot WHERE caso_id = 100", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM comparacion_pieza WHERE snapshot_id = ?", Integer.class, snapshotId)).isEqualTo(4);
        mockMvc.perform(get("/api/v1/cases/100/budget-comparisons/{snapshotId}", snapshotId).header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pieces.length()").value(4));
    }

    @Test
    void shouldPersistMatrixColumnsTermsPricesTiesAndDestructiveSnapshotScopedDeletion() throws Exception {
        Long snapshotId = objectMapper.readTree(generateComparison("matrix-key", List.of(comparisonItem(1, "Optica", "REEMPLAZAR", 250)))).path("comparisonSnapshot").path("id").asLong();
        Long pieceId = jdbcTemplate.queryForObject("SELECT id FROM comparacion_pieza WHERE snapshot_id = ?", Long.class, snapshotId);
        jdbcTemplate.update("INSERT INTO proveedores (id, public_id, nombre, activo) VALUES (702, '00000000-0000-0000-0000-000000007002', 'Norte', true), (703, '00000000-0000-0000-0000-000000007003', 'Sur', true)");
        mockMvc.perform(post("/api/v1/cases/100/budget-comparisons/{snapshotId}/providers", snapshotId).header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON).content("{\"providerId\":702,\"billingCode\":\"A\",\"paymentMethodCode\":\"CONTADO\"}")).andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/cases/100/budget-comparisons/{snapshotId}/providers", snapshotId).header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON).content("{\"providerId\":703,\"billingCode\":\"C\",\"paymentMethodCode\":\"TARJETA_CUOTAS_SIN_INTERES\"}")).andExpect(status().isOk());
        Long north = jdbcTemplate.queryForObject("SELECT id FROM comparacion_proveedor WHERE snapshot_id = ? AND proveedor_id = 702", Long.class, snapshotId);
        Long south = jdbcTemplate.queryForObject("SELECT id FROM comparacion_proveedor WHERE snapshot_id = ? AND proveedor_id = 703", Long.class, snapshotId);
        mockMvc.perform(patch("/api/v1/cases/100/budget-comparisons/{snapshotId}/providers/{columnId}/terms", snapshotId, north).header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON).content("{\"billingCode\":\"SIN_FACTURA\",\"paymentMethodCode\":\"CONTADO\"}")).andExpect(status().isOk());
        for (Long columnId : List.of(north, south)) mockMvc.perform(patch("/api/v1/cases/100/budget-comparisons/{snapshotId}/pieces/{pieceId}/prices/{columnId}", snapshotId, pieceId, columnId).header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON).content("{\"amount\":100}")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/cases/100/budget-comparisons/{snapshotId}", snapshotId).header("X-User-Id", "3")).andExpect(status().isOk()).andExpect(jsonPath("$.providers.length()").value(2)).andExpect(jsonPath("$.providers[0].billingCode").value("SIN_FACTURA")).andExpect(jsonPath("$.pieces[0].cells.length()").value(2)).andExpect(jsonPath("$.pieces[0].cells[0].minimum").value(true)).andExpect(jsonPath("$.pieces[0].cells[1].minimum").value(true)).andExpect(jsonPath("$.bestPriceSubtotal").value(100));
        mockMvc.perform(delete("/api/v1/cases/100/budget-comparisons/{snapshotId}/pieces/{pieceId}/prices/{columnId}", snapshotId, pieceId, north).header("X-User-Id", "3")).andExpect(status().isOk());
        mockMvc.perform(delete("/api/v1/cases/100/budget-comparisons/{snapshotId}/providers/{columnId}", snapshotId, south).header("X-User-Id", "3")).andExpect(status().isOk());
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM comparacion_proveedor WHERE id = ?", Integer.class, south)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM comparacion_precio WHERE comparacion_proveedor_id = ?", Integer.class, south)).isZero();
    }

    @Test
    void shouldRejectLegacyMatrixContractExposeReadOnlyAuditAndGenerateComparisonPdf() throws Exception {
        generateComparison("matrix-before-legacy", List.of(comparisonItem(1, "Espejo", "REEMPLAZAR", 150)));
        Long budgetId = jdbcTemplate.queryForObject("SELECT id FROM presupuestos WHERE caso_id = 100", Long.class);
        jdbcTemplate.update("INSERT INTO comparacion_presupuesto_snapshot (caso_id, presupuesto_id, generacion, fecha_presupuesto, version_presupuesto, idempotency_key, modo) VALUES (100, ?, 99, '2026-04-20', 1, 'legacy-audit', 'LEGACY')", budgetId);
        Long legacyId = jdbcTemplate.queryForObject("SELECT id FROM comparacion_presupuesto_snapshot WHERE idempotency_key = 'legacy-audit'", Long.class);
        mockMvc.perform(get("/api/v1/cases/100/budget-comparisons/{snapshotId}", legacyId).header("X-User-Id", "3")).andExpect(status().isConflict());
        mockMvc.perform(get("/api/v1/cases/100/budget-comparisons/{snapshotId}/legacy-audit", legacyId).header("X-User-Id", "3")).andExpect(status().isOk()).andExpect(jsonPath("$.snapshot.mode").value("LEGACY"));
        Long matrixId = objectMapper.readTree(generateComparison("matrix-pdf", List.of(comparisonItem(1, "Faro", "REEMPLAZAR", 250)))).path("comparisonSnapshot").path("id").asLong();
        var pdf = mockMvc.perform(get("/api/v1/cases/100/budget-comparisons/{snapshotId}/pdf", matrixId).header("X-User-Id", "3")).andExpect(status().isOk()).andExpect(header().string("Content-Type", "application/pdf")).andExpect(header().string("Content-Disposition", containsString("comparacion-"))).andReturn();
        assertThat(pdf.getResponse().getContentAsByteArray().length).isGreaterThan(500);
    }

    @Test
    void shouldSynchronizeExactlyOnceAcrossConcurrentRetriesWithoutCreatingComparisonParts() throws Exception {
        Long snapshotId = objectMapper.readTree(generateComparison("comparison-key-concurrent", List.of(comparisonItem(1, "Optica", "REEMPLAZAR", 250)))).path("comparisonSnapshot").path("id").asLong();
        Long budgetItemId = jdbcTemplate.queryForObject("SELECT id FROM presupuesto_items WHERE presupuesto_id = (SELECT presupuesto_id FROM comparacion_presupuesto_snapshot WHERE id = ?)", Long.class, snapshotId);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM repuestos_caso WHERE caso_id = 100", Integer.class)).isZero();
        executeConcurrently("/api/v1/cases/100/parts/sync-from-budget");
        executeConcurrently("/api/v1/cases/100/parts/sync-from-budget");

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM repuestos_caso WHERE caso_id = 100 AND presupuesto_item_id = ?", Integer.class, budgetItemId)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM repuestos_caso WHERE caso_id = 100 AND presupuesto_item_id IS NOT NULL", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM repuestos_caso WHERE caso_id = 100 AND presupuesto_item_id = ? AND source_type = 'BUDGET_ITEM' AND non_canonical = 0", Integer.class, budgetItemId)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM repuestos_caso WHERE caso_id = 100 AND source_comparison_piece_id IS NOT NULL", Integer.class)).isZero();

        mockMvc.perform(post("/api/v1/cases/100/parts/import-from-comparison").header("X-User-Id", "3"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldRetainActiveCanonicalPartAndRequireAuditedManualResolutionWhenSourceStopsReplacing() throws Exception {
        String response = generateComparison("warning-on-source-change", List.of(comparisonItem(1, "Óptica", "REEMPLAZAR", 250)));
        Long itemId = objectMapper.readTree(response).path("budget").path("items").get(0).path("id").asLong();
        mockMvc.perform(post("/api/v1/cases/100/parts/sync-from-budget").header("X-User-Id", "3")).andExpect(status().isOk());
        Long partId = jdbcTemplate.queryForObject("SELECT id FROM repuestos_caso WHERE caso_id = 100 AND presupuesto_item_id = ?", Long.class, itemId);
        jdbcTemplate.update("UPDATE repuestos_caso SET fecha_recibido = CURRENT_DATE WHERE id = ?", partId);

        mockMvc.perform(put("/api/v1/cases/100/budget/items/{itemId}", itemId).header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new BudgetItemUpdateRequest(1, "Óptica", "CHAPA", "MEDIO", "REEMPLAZAR", "REPARAR", false, new BigDecimal("250"), BigDecimal.ZERO, BigDecimal.ZERO, true))))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/cases/100/parts/sync-from-budget").header("X-User-Id", "3")).andExpect(status().isOk());

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM repuestos_caso WHERE id = ?", Integer.class, partId)).isEqualTo(1);
        Long warningId = jdbcTemplate.queryForObject("SELECT id FROM repuestos_caso_reconciliation_warnings WHERE repuesto_id = ? AND state = 'OPEN'", Long.class, partId);
        mockMvc.perform(post("/api/v1/cases/100/parts/{partId}/reconciliation-warnings/{warningId}/resolve", partId, warningId).header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON).content("{\"resolution\":\"Se conserva hasta completar la devolución\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.state").value("RESOLVED"));
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = 100 AND accion_codigo = 'resolver_advertencia_reconciliacion'", Integer.class)).isEqualTo(1);
    }

    @Test
    void shouldKeepManualPartsUntouchedWhenCanonicalSourcesReconcile() throws Exception {
        generateComparison("manual-protection", List.of(comparisonItem(1, "Óptica", "REEMPLAZAR", 250)));
        mockMvc.perform(post("/api/v1/cases/100/parts").header("X-User-Id", "3").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"description\":\"Óptica\",\"statusCode\":\"PENDIENTE\",\"budgetedPrice\":999,\"finalPrice\":999,\"used\":false,\"returned\":false}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.sourceType").value("MANUAL"));
        mockMvc.perform(post("/api/v1/cases/100/parts/sync-from-budget").header("X-User-Id", "3")).andExpect(status().isOk());
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM repuestos_caso WHERE caso_id = 100 AND source_type = 'MANUAL' AND precio_final = 999", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM repuestos_caso WHERE caso_id = 100 AND source_type = 'BUDGET_ITEM'", Integer.class)).isEqualTo(1);
    }

    @Test
    void shouldNotReconcileLegacyNonCanonicalBudgetLinks() throws Exception {
        String response = generateComparison("legacy-noncanonical", List.of(comparisonItem(1, "Óptica", "REEMPLAZAR", 250)));
        Long itemId = objectMapper.readTree(response).path("budget").path("items").get(0).path("id").asLong();
        mockMvc.perform(post("/api/v1/cases/100/parts/sync-from-budget").header("X-User-Id", "3")).andExpect(status().isOk());
        jdbcTemplate.update("UPDATE repuestos_caso SET non_canonical = 1 WHERE caso_id = 100 AND presupuesto_item_id = ?", itemId);

        mockMvc.perform(post("/api/v1/cases/100/parts/sync-from-budget").header("X-User-Id", "3")).andExpect(status().isOk());

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM repuestos_caso WHERE caso_id = 100 AND presupuesto_item_id = ? AND non_canonical = 1", Integer.class, itemId)).isEqualTo(1);
    }

    private void executeConcurrently(String path) throws Exception {
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<?> first = executor.submit(() -> postAfterSharedStart(path, ready, start));
            Future<?> second = executor.submit(() -> postAfterSharedStart(path, ready, start));
            assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            first.get(10, TimeUnit.SECONDS);
            second.get(10, TimeUnit.SECONDS);
        } finally {
            executor.shutdownNow();
        }
    }

    private void postAfterSharedStart(String path, CountDownLatch ready, CountDownLatch start) {
        try {
            ready.countDown();
            if (!start.await(5, TimeUnit.SECONDS)) throw new AssertionError("Las solicitudes concurrentes no iniciaron");
            mockMvc.perform(post(path).header("X-User-Id", "3")).andExpect(status().isOk());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new AssertionError(exception);
        } catch (Exception exception) {
            throw new AssertionError(exception);
        }
    }

    @Test
    void shouldRegenerateBudgetWithoutDeletingItemsReferencedByCaseParts() throws Exception {
        String firstResponse = generateComparison("comparison-key-referenced-item", List.of(comparisonItem(1, "Optica", "REEMPLAZAR", 250)));
        Long originalItemId = objectMapper.readTree(firstResponse).path("budget").path("items").get(0).path("id").asLong();

        mockMvc.perform(post("/api/v1/cases/100/parts")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"budgetItemId\":" + originalItemId + ",\"description\":\"Optica\",\"statusCode\":\"PENDIENTE\",\"budgetedPrice\":250,\"used\":false,\"returned\":false}"))
                .andExpect(status().isOk());

        String regenerated = generateComparison("comparison-key-referenced-item-v2", List.of(comparisonItem(1, "Optica actualizada", "REEMPLAZAR", 300)));

        assertThat(objectMapper.readTree(regenerated).path("budget").path("items").get(0).path("id").asLong()).isEqualTo(originalItemId);
        assertThat(jdbcTemplate.queryForObject("SELECT presupuesto_item_id FROM repuestos_caso WHERE caso_id = ?", Long.class, 100L)).isEqualTo(originalItemId);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM comparacion_pieza WHERE presupuesto_item_origen_id = ?", Integer.class, originalItemId)).isEqualTo(2);
        assertThat(jdbcTemplate.queryForList("SELECT valor_repuesto_fuente FROM comparacion_pieza WHERE presupuesto_item_origen_id = ? ORDER BY id", BigDecimal.class, originalItemId))
                .containsExactly(new BigDecimal("250.00"), new BigDecimal("300.00"));
    }

    private String generateComparison(String key, List<BudgetItemCreateRequest> items) throws Exception {
        return mockMvc.perform(post("/api/v1/cases/100/budget/generate")
                        .header("X-User-Id", "3").header("Idempotency-Key", key).contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new BudgetUpsertRequest(LocalDate.of(2026, 4, 20), "BORRADOR", new BigDecimal("1000.00"), new BigDecimal("21.00"), new BigDecimal("0.00"), 5, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, items))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
    }

    private BudgetItemCreateRequest comparisonItem(int order, String piece, String action, int amount) {
        return new BudgetItemCreateRequest(order, piece, "CHAPA", "MEDIO", "REEMPLAZAR", action, false, new BigDecimal(amount), BigDecimal.ZERO, BigDecimal.ZERO);
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
