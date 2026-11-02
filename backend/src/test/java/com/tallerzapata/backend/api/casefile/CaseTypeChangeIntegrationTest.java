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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CaseTypeChangeIntegrationTest {

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
        jdbcTemplate.update("UPDATE tipos_tramite SET activo = 1");
        seedPeopleAndVehicles();
    }

    @Test
    void shouldChangeCaseTypeOnVirginCaseAndRegenerateFolderCode() throws Exception {
        Long caseId = createCase(1L);
        assertThat(jdbcTemplate.queryForObject("SELECT codigo_carpeta FROM casos WHERE id = ?", String.class, caseId)).isEqualTo("0001PZ");

        mockMvc.perform(put("/api/v1/cases/" + caseId)
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"caseTypeId\":2}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caseTypeCode").value("TODO_RIESGO"))
                .andExpect(jsonPath("$.folderCode").value("0001TZ"));

        assertThat(jdbcTemplate.queryForObject("SELECT tipo_tramite_id FROM casos WHERE id = ?", Long.class, caseId)).isEqualTo(2L);
        assertThat(jdbcTemplate.queryForObject("SELECT codigo_carpeta FROM casos WHERE id = ?", String.class, caseId)).isEqualTo("0001TZ");
    }

    @Test
    void shouldForceGranizoFolderPrefixWhenChangingToGranizo() throws Exception {
        Long caseId = createCase(2L);

        mockMvc.perform(put("/api/v1/cases/" + caseId)
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"caseTypeId\":3}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caseTypeCode").value("GRANIZO"))
                .andExpect(jsonPath("$.folderCode").value("0001GZ"));
    }

    @Test
    void shouldPreserveCaseDataWhenChangingType() throws Exception {
        Long caseId = createCase(1L);

        mockMvc.perform(put("/api/v1/cases/" + caseId)
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"caseTypeId\":2}"))
                .andExpect(status().isOk());

        // El cliente principal, vehiculo y numero de orden se conservan intactos.
        assertThat(jdbcTemplate.queryForObject("SELECT cliente_principal_persona_id FROM casos WHERE id = ?", Long.class, caseId)).isEqualTo(10L);
        assertThat(jdbcTemplate.queryForObject("SELECT vehiculo_principal_id FROM casos WHERE id = ?", Long.class, caseId)).isEqualTo(10L);
        assertThat(jdbcTemplate.queryForObject("SELECT numero_orden FROM casos WHERE id = ?", Long.class, caseId)).isEqualTo(1L);
    }

    @Test
    void shouldRejectTypeChangeWhenCaseHasActivity() throws Exception {
        Long caseId = createCase(1L);
        jdbcTemplate.update(
                "INSERT INTO presupuestos (caso_id, organizacion_id, sucursal_id, fecha_presupuesto, informe_estado_codigo, version_actual) VALUES (?, 1, 1, CURRENT_DATE, 'BORRADOR', 1)",
                caseId
        );

        mockMvc.perform(put("/api/v1/cases/" + caseId)
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"caseTypeId\":2}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("No se puede cambiar el tipo de la carpeta porque ya tiene presupuesto"));

        assertThat(jdbcTemplate.queryForObject("SELECT tipo_tramite_id FROM casos WHERE id = ?", Long.class, caseId)).isEqualTo(1L);
    }

    @Test
    void shouldRejectTypeChangeToUnknownType() throws Exception {
        Long caseId = createCase(1L);

        mockMvc.perform(put("/api/v1/cases/" + caseId)
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"caseTypeId\":9999}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("No existe el tipo de tramite 9999"));
    }

    private Long createCase(Long caseTypeId) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/cases")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new CaseCreateRequest(
                                caseTypeId, 1L, 1L, 10L, 10L, false, null, null, null, null,
                                null, null, null, null, null, null, null, null, "CLIENTE", "PRINCIPAL"))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
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
