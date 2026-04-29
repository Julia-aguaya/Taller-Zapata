package com.tallerzapata.backend.api.system;

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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SystemParameterIntegrationTest {

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
    void shouldListParameters() throws Exception {
        jdbcTemplate.update("INSERT INTO parametros_sistema (codigo, valor, tipo_dato_codigo, descripcion, editable, visible, modulo_codigo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                "TEST_PARAM_1", "value1", "STRING", "Desc 1", true, true, "TEST");
        jdbcTemplate.update("INSERT INTO parametros_sistema (codigo, valor, tipo_dato_codigo, descripcion, editable, visible, modulo_codigo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                "TEST_PARAM_2", "42", "NUMBER", "Desc 2", true, false, "TEST");

        mockMvc.perform(get("/api/v1/system/parameters")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].code").value("TEST_PARAM_1"));

        mockMvc.perform(get("/api/v1/system/parameters?module=TEST")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].code").value("TEST_PARAM_1"));
    }

    @Test
    void shouldGetParameterByCode() throws Exception {
        jdbcTemplate.update("INSERT INTO parametros_sistema (codigo, valor, tipo_dato_codigo, descripcion, editable, visible, modulo_codigo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                "TEST_PARAM", "test-value", "STRING", "Test desc", true, true, "GENERAL");

        mockMvc.perform(get("/api/v1/system/parameters/TEST_PARAM")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("TEST_PARAM"))
                .andExpect(jsonPath("$.value").value("test-value"))
                .andExpect(jsonPath("$.dataTypeCode").value("STRING"));
    }

    @Test
    void shouldUpsertParameter() throws Exception {
        mockMvc.perform(put("/api/v1/system/parameters/NEW_PARAM")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new SystemParameterUpsertRequest("NEW_PARAM", "new-value", "STRING", "New desc", true, true, "GENERAL"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("NEW_PARAM"))
                .andExpect(jsonPath("$.value").value("new-value"));

        Integer auditCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM auditoria_eventos WHERE accion_codigo = 'upsert_parametro_sistema'", Integer.class);
        assertThat(auditCount).isEqualTo(1);

        mockMvc.perform(put("/api/v1/system/parameters/NEW_PARAM")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new SystemParameterUpsertRequest("NEW_PARAM", "updated-value", "STRING", "Updated desc", true, true, "GENERAL"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.value").value("updated-value"));
    }

    @Test
    void shouldRejectInvalidDataTypeCode() throws Exception {
        mockMvc.perform(put("/api/v1/system/parameters/BAD_PARAM")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new SystemParameterUpsertRequest("BAD_PARAM", "x", "INVALID_TYPE", null, true, true, "GENERAL"))))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldNotEditNonEditableParameter() throws Exception {
        jdbcTemplate.update("INSERT INTO parametros_sistema (codigo, valor, tipo_dato_codigo, descripcion, editable, visible, modulo_codigo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                "LOCKED_PARAM", "locked-value", "STRING", "Locked desc", false, true, "GENERAL");

        mockMvc.perform(put("/api/v1/system/parameters/LOCKED_PARAM")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new SystemParameterUpsertRequest("LOCKED_PARAM", "new-value", "STRING", null, true, true, "GENERAL"))))
                .andExpect(status().isConflict());
    }

    private void seedBaseData() {
        jdbcTemplate.update("INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 3L, "00000000-0000-0000-0000-000000000300", "operador", "operador@tallerzapata.local", "hash", "Olivia", "Operadora", true);
        jdbcTemplate.update("INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (?, ?, ?, ?, ?, ?)", 3L, 3L, 2L, 1L, 1L, true);
    }
}
