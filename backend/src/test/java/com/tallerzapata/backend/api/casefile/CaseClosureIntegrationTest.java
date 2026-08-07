package com.tallerzapata.backend.api.casefile;

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

import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CaseClosureIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private TestDatabaseCleaner cleaner;

    @BeforeEach
    void setUp() {
        cleaner.cleanAll();
        jdbcTemplate.update("INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?,?,?,?,?,?,?,?,?,?)",
                10L, "00000000-0000-0000-0000-000000001010", "fisica", "Carlos", "Cliente", "Carlos Cliente", "DNI", "30111222", "30111222", true);
        jdbcTemplate.update("INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (?,?,?,?,?)",
                10L, "00000000-0000-0000-0000-000000002010", "AB123CD", "AB123CD", true);
        // Marca y modelo para que el vehículo esté comercialmente completo
        jdbcTemplate.update("UPDATE vehiculos SET marca_texto='Ford',modelo_texto='Focus',anio=2020,tipo_vehiculo_codigo='SEDAN',uso_codigo='PARTICULAR',caja_codigo='MANUAL' WHERE id=10");
    }

    // ── PARTICULAR closure ──────────────────────────────────────

    @Test
    void shouldNotCloseWhenNoDefinitiveOutcome() throws Exception {
        Long caseId = createParticularCase();
        addPayment(caseId, new BigDecimal("100000"));

        // Trigger closure sync (any finance operation should trigger it)
        mockMvc.perform(get("/api/v1/cases/{caseId}", caseId)
                .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.closedAt").value(nullValue()));
    }

    @Test
    void shouldNotCloseWhenNotFullyPaid() throws Exception {
        Long caseId = createParticularCase();
        createDefinitiveOutcome(caseId);

        mockMvc.perform(get("/api/v1/cases/{caseId}", caseId)
                .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.closedAt").value(nullValue()));
    }

    @Test
    void shouldCloseWhenDefinitiveOutcomeAndFullyPaid() throws Exception {
        Long caseId = createParticularCase();
        createDefinitiveOutcome(caseId);
        addPayment(caseId, new BigDecimal("100000"));

        // Trigger closure via finance sync
        addPayment(caseId, new BigDecimal("50000"));

        mockMvc.perform(get("/api/v1/cases/{caseId}", caseId)
                .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.closedAt").value(notNullValue()));
    }

    // ── TODO_RIESGO closure ──────────────────────────────────────

    @Test
    void shouldNotCloseTodoRiesgoWhenFranchisePending() throws Exception {
        Long caseId = createTodoRiesgoCase();
        seedInsurance(caseId);
        jdbcTemplate.update("INSERT INTO franquicias_caso (caso_id, estado_codigo, monto, modo_recupero_codigo) VALUES (?,?,?,?)",
                caseId, "PENDIENTE", new BigDecimal("50000"), "CIA_DEL_TERCERO");
        createDefinitiveOutcome(caseId);

        mockMvc.perform(get("/api/v1/cases/{caseId}", caseId)
                .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.closedAt").value(nullValue()));
    }

    @Test
    void shouldNotCloseTodoRiesgoWhenCompanyNotPaid() throws Exception {
        Long caseId = createTodoRiesgoCase();
        seedInsurance(caseId);
        createDefinitiveOutcome(caseId);

        mockMvc.perform(get("/api/v1/cases/{caseId}", caseId)
                .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.closedAt").value(nullValue()));
    }

    // ── Helpers ──────────────────────────────────────────────────

    private Long createParticularCase() throws Exception {
        String response = mockMvc.perform(post("/api/v1/cases")
                .header("X-User-Id", "1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"caseTypeId\":1,\"organizationId\":1,\"branchId\":1,\"principalVehicleId\":10,\"principalCustomerPersonId\":10,\"referenced\":false,\"priorityCode\":null,\"customerRoleCode\":\"CLIENTE\",\"principalVehicleRoleCode\":\"PRINCIPAL\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }

    private Long createTodoRiesgoCase() throws Exception {
        String response = mockMvc.perform(post("/api/v1/cases")
                .header("X-User-Id", "1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"caseTypeId\":2,\"organizationId\":1,\"branchId\":1,\"principalVehicleId\":10,\"principalCustomerPersonId\":10,\"referenced\":false,\"priorityCode\":null,\"customerRoleCode\":\"CLIENTE\",\"principalVehicleRoleCode\":\"PRINCIPAL\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }

    private void createDefinitiveOutcome(Long caseId) throws Exception {
        // Create appointment
        mockMvc.perform(post("/api/v1/cases/{caseId}/appointments", caseId)
                .header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON)
                .content("{\"appointmentDate\":\"2026-01-10\",\"appointmentTime\":\"09:00\",\"estimatedDays\":2,\"statusCode\":\"PENDIENTE\",\"reentry\":false,\"userId\":1}"))
                .andExpect(status().isOk());
        // Create intake
        mockMvc.perform(post("/api/v1/cases/{caseId}/intakes", caseId)
                .header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON)
                .content("{\"appointmentId\":1,\"vehicleId\":10,\"intakeAt\":\"2026-01-10T10:00:00\",\"mileage\":15000,\"receivedByUserId\":1,\"hasObservations\":false}"))
                .andExpect(status().isOk());
        // Create definitive outcome
        mockMvc.perform(post("/api/v1/cases/{caseId}/outcomes", caseId)
                .header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON)
                .content("{\"intakeId\":1,\"outcomeAt\":\"2026-01-12T18:00:00\",\"deliveredByUserId\":1,\"definitive\":true,\"shouldReenter\":false,\"repairedPhotosUploaded\":false}"))
                .andExpect(status().isOk());
    }

    private void addPayment(Long caseId, BigDecimal amount) throws Exception {
        mockMvc.perform(post("/api/v1/cases/{caseId}/financial-movements", caseId)
                .header("X-User-Id", "1").contentType(MediaType.APPLICATION_JSON)
                .content("{\"movementTypeCode\":\"INGRESO\",\"flowOriginCode\":\"CLIENTE\",\"counterpartyTypeCode\":\"PERSONA\",\"counterpartyPersonId\":10,\"movementAt\":\"2026-01-15T12:00:00\",\"grossAmount\":" + amount + ",\"netAmount\":" + amount + ",\"paymentMethodCode\":\"EFECTIVO\",\"advancePayment\":false,\"bonification\":false,\"retentions\":[],\"applications\":[]}"))
                .andExpect(status().isOk());
    }

    private void seedInsurance(Long caseId) {
        jdbcTemplate.update("INSERT INTO companias_seguro (id, public_id, nombre, activo) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE nombre = nombre",
                1L, "00000000-0000-0000-0000-000000000101", "La Segunda", true);
        jdbcTemplate.update("INSERT INTO caso_seguro (caso_id, compania_seguro_id) VALUES (?,?) ON DUPLICATE KEY UPDATE compania_seguro_id = compania_seguro_id",
                caseId, 1L);
        jdbcTemplate.update("INSERT INTO tramitacion_seguro (caso_id, fecha_cotizacion, monto_acordado, monto_facturar_compania) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE fecha_cotizacion = fecha_cotizacion",
                caseId, LocalDate.now(), new BigDecimal("100000"), new BigDecimal("100000"));
    }
}
