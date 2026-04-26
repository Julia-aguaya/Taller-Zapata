package com.tallerzapata.backend.api.budget;

import com.fasterxml.jackson.databind.ObjectMapper;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BudgetIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM repuestos_caso");
        jdbcTemplate.update("DELETE FROM presupuesto_items");
        jdbcTemplate.update("DELETE FROM presupuestos");
        jdbcTemplate.update("DELETE FROM legal_gastos");
        jdbcTemplate.update("DELETE FROM legal_novedades");
        jdbcTemplate.update("DELETE FROM caso_legal");
        jdbcTemplate.update("DELETE FROM caso_terceros");
        jdbcTemplate.update("DELETE FROM caso_cleas");
        jdbcTemplate.update("DELETE FROM caso_franquicia");
        jdbcTemplate.update("DELETE FROM caso_tramitacion_seguro");
        jdbcTemplate.update("DELETE FROM caso_seguro");
        jdbcTemplate.update("DELETE FROM companias_contactos");
        jdbcTemplate.update("DELETE FROM companias_seguro");
        jdbcTemplate.update("DELETE FROM movimiento_aplicaciones");
        jdbcTemplate.update("DELETE FROM movimiento_retenciones");
        jdbcTemplate.update("DELETE FROM movimientos_financieros");
        jdbcTemplate.update("DELETE FROM comprobantes_emitidos");
        jdbcTemplate.update("DELETE FROM documento_relaciones");
        jdbcTemplate.update("DELETE FROM documentos");
        jdbcTemplate.update("DELETE FROM egresos_vehiculo");
        jdbcTemplate.update("DELETE FROM ingreso_items");
        jdbcTemplate.update("DELETE FROM ingresos_vehiculo");
        jdbcTemplate.update("DELETE FROM turnos_reparacion");
        jdbcTemplate.update("DELETE FROM tareas");
        jdbcTemplate.update("DELETE FROM auditoria_eventos");
        jdbcTemplate.update("DELETE FROM caso_estado_historial");
        jdbcTemplate.update("DELETE FROM caso_relaciones");
        jdbcTemplate.update("DELETE FROM caso_siniestro");
        jdbcTemplate.update("DELETE FROM caso_vehiculos");
        jdbcTemplate.update("DELETE FROM caso_personas");
        jdbcTemplate.update("DELETE FROM casos");
        jdbcTemplate.update("DELETE FROM vehiculos");
        jdbcTemplate.update("DELETE FROM personas");
        jdbcTemplate.update("DELETE FROM usuario_roles WHERE usuario_id <> 1");
        jdbcTemplate.update("DELETE FROM usuarios WHERE id <> 1");
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
                                "Observaciones iniciales"
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
                                new BigDecimal("500.00"), 5, null, null
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/cases/100/budget/items")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new BudgetItemCreateRequest(
                                1, "Paragolpes delantero", "CHAPA", "MEDIO",
                                "REPARAR", "DESABOLLAR", false,
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
                                new BigDecimal("500.00"), 5, null, null
                        ))))
                .andExpect(status().isOk());

        String itemResponse = mockMvc.perform(post("/api/v1/cases/100/budget/items")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new BudgetItemCreateRequest(
                                1, "Paragolpes delantero", "CHAPA", "MEDIO",
                                "REPARAR", "DESABOLLAR", false,
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
                                "PULIR", "PINTAR", false,
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
                                new BigDecimal("500.00"), 5, null, null
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
                                new BigDecimal("500.00"), 5, null, null
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/cases/100/budget/items")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new BudgetItemCreateRequest(
                                1, "Paragolpes", "INVALIDO", "MEDIO",
                                "REPARAR", "DESABOLLAR", false,
                                new BigDecimal("0.00"), new BigDecimal("3.50"), new BigDecimal("350.00")
                        ))))
                .andExpect(status().isConflict());
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
