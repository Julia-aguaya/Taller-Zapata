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
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CaseCreateIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TestDatabaseCleaner cleaner;

    @BeforeEach
    void setUp() {
        cleaner.cleanAll();

        seedPeopleAndVehicles();
    }

    @Test
    void shouldCreateCaseAndPersistCoreRelationsAndHistory() throws Exception {
        CaseCreateRequest request = new CaseCreateRequest(
                1L,
                1L,
                1L,
                10L,
                10L,
                false,
                null,
                "",
                "ALTA",
                "Observacion inicial",
                LocalDate.of(2026, 4, 20),
                LocalTime.of(10, 30),
                "Av. Siempre Viva 742",
                "Choque lateral",
                "Sin lesionados",
                LocalDate.of(2026, 5, 20),
                2,
                "CLIENTE",
                "PRINCIPAL"
        );

        MvcResult result = mockMvc.perform(post("/api/v1/cases")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.folderCode").value("0001PZ"))
                .andExpect(jsonPath("$.orderNumber").value(1))
                .andExpect(jsonPath("$.currentCaseStateCode").value("INGRESADO"))
                .andExpect(jsonPath("$.currentRepairStateCode").value("SIN_TURNO"))
                .andReturn();

        Long caseId = objectMapper.readTree(result.getResponse().getContentAsByteArray()).get("id").asLong();

        Integer casePersonCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM caso_personas WHERE caso_id = ? AND persona_id = ? AND rol_caso_codigo = ? AND es_principal = 1",
                Integer.class,
                caseId,
                10L,
                "CLIENTE"
        );
        Integer caseVehicleCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM caso_vehiculos WHERE caso_id = ? AND vehiculo_id = ? AND rol_vehiculo_codigo = ? AND es_principal = 1",
                Integer.class,
                caseId,
                10L,
                "PRINCIPAL"
        );
        Integer caseIncidentCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM caso_siniestro WHERE caso_id = ?",
                Integer.class,
                caseId
        );
        Integer historyCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM caso_estado_historial WHERE caso_id = ?",
                Integer.class,
                caseId
        );
        Integer auditCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'crear'",
                Integer.class,
                caseId
        );

        assertThat(casePersonCount).isEqualTo(1);
        assertThat(caseVehicleCount).isEqualTo(1);
        assertThat(caseIncidentCount).isEqualTo(1);
        assertThat(historyCount).isEqualTo(5);
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void shouldRejectCreateWhenBranchDoesNotExist() throws Exception {
        CaseCreateRequest request = new CaseCreateRequest(
                1L,
                1L,
                999L,
                10L,
                10L,
                false,
                null,
                null,
                "MEDIA",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                "CLIENTE",
                "PRINCIPAL"
        );

        mockMvc.perform(post("/api/v1/cases")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("No existe la sucursal 999"));
    }

    @Test
    void shouldRejectCreateWhenPrincipalPersonDoesNotExist() throws Exception {
        CaseCreateRequest request = new CaseCreateRequest(
                1L,
                1L,
                1L,
                10L,
                999L,
                false,
                null,
                null,
                "MEDIA",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                "CLIENTE",
                "PRINCIPAL"
        );

        mockMvc.perform(post("/api/v1/cases")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("No existe la persona principal 999"));
    }

    @Test
    void shouldExposeCaseCatalogsForFrontendForms() throws Exception {
        mockMvc.perform(get("/api/v1/cases/catalogs")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caseTypes.length()").isNumber())
                .andExpect(jsonPath("$.caseTypes[0].code").value("PARTICULAR"))
                .andExpect(jsonPath("$.customerRoleCodes[0].code").isString())
                .andExpect(jsonPath("$.principalVehicleRoleCodes[0].code").isString())
                .andExpect(jsonPath("$.priorityCodes[0].code").isString())
                .andExpect(jsonPath("$.workflowDomains.length()").value(5));
    }

    @Test
    void shouldRejectCreateWhenCaseRoleCodeIsInvalid() throws Exception {
        CaseCreateRequest request = new CaseCreateRequest(
                1L,
                1L,
                1L,
                10L,
                10L,
                false,
                null,
                null,
                "MEDIA",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                "NO_EXISTE",
                "PRINCIPAL"
        );

        mockMvc.perform(post("/api/v1/cases")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("customerRoleCode no permitido: NO_EXISTE"));
    }

    private void seedPeopleAndVehicles() {
        jdbcTemplate.update(
                "INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                10L, "00000000-0000-0000-0000-000000001010", "fisica", "Carlos", "Cliente", "Carlos Cliente", "DNI", "30111222", "30111222", true
        );
        jdbcTemplate.update(
                "INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (?, ?, ?, ?, ?)",
                10L, "00000000-0000-0000-0000-000000002010", "AB123CD", "AB123CD", true
        );
    }
}
