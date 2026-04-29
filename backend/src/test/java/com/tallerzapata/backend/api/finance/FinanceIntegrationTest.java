package com.tallerzapata.backend.api.finance;

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
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FinanceIntegrationTest {

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
    void shouldCreateMovementAndSummarizeCase() throws Exception {
        FinancialMovementCreateRequest request = new FinancialMovementCreateRequest(
                null,
                "INGRESO",
                "CLIENTE",
                "PERSONA",
                10L,
                null,
                LocalDateTime.of(2026, 5, 11, 10, 30),
                new BigDecimal("1000.00"),
                new BigDecimal("900.00"),
                "TRANSFERENCIA",
                "Alias taller",
                "FRANQUICIA",
                false,
                false,
                "Pago parcial",
                "TX-001",
                List.of(new FinancialMovementRetentionRequest("IIBB", new BigDecimal("100.00"), "Retencion provincial")),
                List.of(new FinancialMovementApplicationRequest("FRANQUICIA", "CASO", 100L, new BigDecimal("900.00")))
        );

        mockMvc.perform(post("/api/v1/cases/100/financial-movements")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movementTypeCode").value("INGRESO"))
                .andExpect(jsonPath("$.retentions[0].retentionTypeCode").value("IIBB"));

        mockMvc.perform(get("/api/v1/cases/100/finance-summary")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalIngresos").value(900.00))
                .andExpect(jsonPath("$.saldo").value(900.00));

        Integer auditCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'crear_movimiento_financiero'",
                Integer.class,
                100L
        );
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void shouldCreateMovementWithCompanyCounterparty() throws Exception {
        FinancialMovementCreateRequest request = new FinancialMovementCreateRequest(
                null,
                "INGRESO",
                "ASEGURADORA",
                "COMPANIA",
                null,
                1L,
                LocalDateTime.of(2026, 5, 11, 10, 30),
                new BigDecimal("2000.00"),
                new BigDecimal("2000.00"),
                "TRANSFERENCIA",
                "Cuenta aseguradora",
                null,
                false,
                false,
                "Pago aseguradora",
                "TX-002",
                null,
                null
        );

        mockMvc.perform(post("/api/v1/cases/100/financial-movements")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movementTypeCode").value("INGRESO"))
                .andExpect(jsonPath("$.counterpartyTypeCode").value("COMPANIA"))
                .andExpect(jsonPath("$.counterpartyCompanyId").value(1));
    }

    @Test
    void shouldCreateReceiptAndListFinanceCatalogs() throws Exception {
        IssuedReceiptCreateRequest request = new IssuedReceiptCreateRequest(
                "FACTURA",
                "A-0001-00000001",
                "Carlos Cliente",
                LocalDate.of(2026, 5, 11),
                new BigDecimal("1000.00"),
                new BigDecimal("210.00"),
                new BigDecimal("1210.00"),
                null,
                "Factura inicial",
                null
        );

        mockMvc.perform(post("/api/v1/cases/100/receipts")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.receiptTypeCode").value("FACTURA"));

        mockMvc.perform(get("/api/v1/finance/catalogs")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movementTypeCodes.length()").isNumber())
                .andExpect(jsonPath("$.receiptTypeCodes.length()").isNumber());
    }

    @Test
    void shouldAddRetentionsToMovement() throws Exception {
        FinancialMovementCreateRequest createRequest = new FinancialMovementCreateRequest(
                null,
                "INGRESO",
                "CLIENTE",
                "PERSONA",
                10L,
                null,
                LocalDateTime.of(2026, 5, 11, 10, 30),
                new BigDecimal("1000.00"),
                new BigDecimal("900.00"),
                "TRANSFERENCIA",
                "Alias taller",
                null,
                false,
                false,
                "Pago parcial",
                "TX-001",
                null,
                null
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/cases/100/financial-movements")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(createRequest)))
                .andExpect(status().isOk())
                .andReturn();

        Long movementId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        List<FinancialMovementRetentionRequest> retentionRequests = List.of(
                new FinancialMovementRetentionRequest("IIBB", new BigDecimal("50.00"), "Retencion test")
        );

        mockMvc.perform(post("/api/v1/financial-movements/{movementId}/retentions", movementId)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(retentionRequests)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].retentionTypeCode").value("IIBB"))
                .andExpect(jsonPath("$[0].amount").value(50.00));

        Integer auditCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'crear_retenciones_movimiento'",
                Integer.class,
                100L
        );
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void shouldAddApplicationsToMovement() throws Exception {
        FinancialMovementCreateRequest createRequest = new FinancialMovementCreateRequest(
                null,
                "INGRESO",
                "CLIENTE",
                "PERSONA",
                10L,
                null,
                LocalDateTime.of(2026, 5, 11, 10, 30),
                new BigDecimal("1000.00"),
                new BigDecimal("900.00"),
                "TRANSFERENCIA",
                "Alias taller",
                null,
                false,
                false,
                "Pago parcial",
                "TX-002",
                null,
                null
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/cases/100/financial-movements")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(createRequest)))
                .andExpect(status().isOk())
                .andReturn();

        Long movementId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        List<FinancialMovementApplicationRequest> applicationRequests = List.of(
                new FinancialMovementApplicationRequest("MANO_OBRA", "CASO", 100L, new BigDecimal("400.00"))
        );

        mockMvc.perform(post("/api/v1/financial-movements/{movementId}/applications", movementId)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(applicationRequests)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].conceptCode").value("MANO_OBRA"))
                .andExpect(jsonPath("$[0].appliedAmount").value(400.00));

        Integer auditCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'crear_aplicaciones_movimiento'",
                Integer.class,
                100L
        );
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void shouldRejectInvalidRetentionTypeCode() throws Exception {
        FinancialMovementCreateRequest createRequest = new FinancialMovementCreateRequest(
                null,
                "INGRESO",
                "CLIENTE",
                "PERSONA",
                10L,
                null,
                LocalDateTime.of(2026, 5, 11, 10, 30),
                new BigDecimal("1000.00"),
                new BigDecimal("900.00"),
                "TRANSFERENCIA",
                "Alias taller",
                null,
                false,
                false,
                "Pago parcial",
                "TX-003",
                null,
                null
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/cases/100/financial-movements")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(createRequest)))
                .andExpect(status().isOk())
                .andReturn();

        Long movementId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        List<FinancialMovementRetentionRequest> retentionRequests = List.of(
                new FinancialMovementRetentionRequest("INVALIDO", new BigDecimal("50.00"), "Retencion invalida")
        );

        mockMvc.perform(post("/api/v1/financial-movements/{movementId}/retentions", movementId)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(retentionRequests)))
                .andExpect(status().isConflict());
    }

    private void seedBaseData() {
        jdbcTemplate.update("INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 3L, "00000000-0000-0000-0000-000000000300", "operador", "operador@tallerzapata.local", "hash", "Olivia", "Operadora", true);
        jdbcTemplate.update("INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (?, ?, ?, ?, ?, ?)", 3L, 3L, 2L, 1L, 1L, true);
        jdbcTemplate.update("INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 10L, "00000000-0000-0000-0000-000000001010", "fisica", "Carlos", "Cliente", "Carlos Cliente", "DNI", "30111222", "30111222", true);
        jdbcTemplate.update("INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (?, ?, ?, ?, ?)", 10L, "00000000-0000-0000-0000-000000002010", "AB123CD", "AB123CD", true);
        jdbcTemplate.update("INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 100L, "00000000-0000-0000-0000-000000003100", "0100PZ", 100L, 1L, 1L, 1L, 10L, 10L, false, 1L, 1L, 4L, 7L, 9L, 11L, "MEDIA");
        jdbcTemplate.update("INSERT INTO caso_personas (id, caso_id, persona_id, rol_caso_codigo, vehiculo_id, es_principal, notas) VALUES (?, ?, ?, ?, ?, ?, ?)", 1L, 100L, 10L, "CLIENTE", null, true, null);
        jdbcTemplate.update("MERGE INTO companias_seguro (id, public_id, codigo, nombre, cuit, requiere_fotos_reparado, dias_pago_esperados, activo) KEY(id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 1L, "00000000-0000-0000-0000-000000004001", "SANCOR", "Sancor Seguros", "30-12345678-9", false, 30, true);
    }
}
