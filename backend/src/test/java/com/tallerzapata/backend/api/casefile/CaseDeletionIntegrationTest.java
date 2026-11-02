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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CaseDeletionIntegrationTest {

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
        seedOperatorUser();
    }

    @Test
    void shouldDeleteVirginCaseAndReuseOrderNumber() throws Exception {
        Long caseId = createCase(1L);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM casos WHERE id = ?", Integer.class, caseId)).isEqualTo(1);

        mockMvc.perform(delete("/api/v1/cases/" + caseId)
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Creada por error\"}"))
                .andExpect(status().isOk());

        // La carpeta y sus artefactos de creacion desaparecen por completo.
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM casos WHERE id = ?", Integer.class, caseId)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM caso_personas WHERE caso_id = ?", Integer.class, caseId)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM caso_vehiculos WHERE caso_id = ?", Integer.class, caseId)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM caso_estado_historial WHERE caso_id = ?", Integer.class, caseId)).isZero();

        // La auditoria de creacion se borra, pero el evento de eliminacion sobrevive (caseId nulo).
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ?", Integer.class, caseId)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM auditoria_eventos WHERE accion_codigo = 'eliminar_caso'", Integer.class)).isEqualTo(1);

        // El numero de orden queda disponible: la siguiente carpeta reutiliza el numero 1.
        Long recreated = createCase(1L);
        assertThat(jdbcTemplate.queryForObject("SELECT numero_orden FROM casos WHERE id = ?", Long.class, recreated)).isEqualTo(1L);
        assertThat(jdbcTemplate.queryForObject("SELECT codigo_carpeta FROM casos WHERE id = ?", String.class, recreated)).isEqualTo("0001PZ");
    }

    @Test
    void shouldRequireReasonToDelete() throws Exception {
        Long caseId = createCase(1L);

        mockMvc.perform(delete("/api/v1/cases/" + caseId)
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("El motivo de eliminacion es obligatorio"));
    }

    @Test
    void shouldRejectDeletionWhenCaseHasActivity() throws Exception {
        Long caseId = createCase(1L);
        jdbcTemplate.update(
                "INSERT INTO presupuestos (caso_id, organizacion_id, sucursal_id, fecha_presupuesto, informe_estado_codigo, version_actual) VALUES (?, 1, 1, CURRENT_DATE, 'BORRADOR', 1)",
                caseId
        );

        mockMvc.perform(delete("/api/v1/cases/" + caseId)
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Intento\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("No se puede eliminar la carpeta porque ya tiene presupuesto"));

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM casos WHERE id = ?", Integer.class, caseId)).isEqualTo(1);
    }

    @Test
    void shouldRejectDeletionWithoutPermission() throws Exception {
        Long caseId = createCase(1L);

        mockMvc.perform(delete("/api/v1/cases/" + caseId)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Intento\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("El usuario no tiene el permiso requerido: caso.eliminar"));
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

    private void seedOperatorUser() {
        jdbcTemplate.update(
                "INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                3L, "00000000-0000-0000-0000-000000000300", "operador-zapata", "operador-zapata@tallerzapata.local", "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", "Operador", "Sucursal", true
        );
        jdbcTemplate.update(
                "INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (?, ?, ?, ?, ?, ?)",
                3L, 3L, 2L, 1L, 1L, true
        );
    }
}
