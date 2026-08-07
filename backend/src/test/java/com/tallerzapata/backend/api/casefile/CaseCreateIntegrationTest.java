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
                null,
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
    void shouldCreateCaseUsingDefaultScopeAndDefaultRoleCodes() throws Exception {
        jdbcTemplate.update(
                "INSERT INTO usuario_roles (usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (?, ?, ?, ?, ?)",
                1L, 1L, 1L, 1L, true
        );

        CaseCreateRequest request = new CaseCreateRequest(
                1L,
                null,
                null,
                10L,
                10L,
                false,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        mockMvc.perform(post("/api/v1/cases")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.folderCode").value("0001PZ"))
                .andExpect(jsonPath("$.caseTypeCode").value("PARTICULAR"))
                .andExpect(jsonPath("$.createdByDisplayName").value("Admin Bootstrap"));
    }

    @Test
    void shouldCreateLawyerThirdPartyCaseWithLawyerFolderCode() throws Exception {
        CaseCreateRequest request = new CaseCreateRequest(
                6L,
                1L,
                1L,
                10L,
                10L,
                false,
                null,
                null,
                null,
                "",
                "ALTA",
                "Reclamo con abogado",
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

        mockMvc.perform(post("/api/v1/cases")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.folderCode").value("0001RAZ"))
                .andExpect(jsonPath("$.caseTypeCode").value("RECLAMO_TERCEROS_ABOGADO"))
                .andExpect(jsonPath("$.currentCaseStateCode").value("INGRESADO"));
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
