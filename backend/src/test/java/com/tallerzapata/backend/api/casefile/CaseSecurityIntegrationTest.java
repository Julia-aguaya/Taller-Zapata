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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CaseSecurityIntegrationTest {

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

        seedVehiclesAndPeople();
        seedCases();
        seedUsers();
        // Limpiar transiciones de test de corridas anteriores (H2 in-memory persiste entre tests)
        jdbcTemplate.update("DELETE FROM workflow_transiciones WHERE id >= 9000");
        seedWorkflowTransitions();
    }

    @Test
    void shouldRejectCasesWithoutAuthenticatedHeader() throws Exception {
        mockMvc.perform(get("/api/v1/cases"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldAllowCasesWithValidUserHeader() throws Exception {
        mockMvc.perform(get("/api/v1/cases")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldRejectCaseListWhenAuthenticatedUserLacksPermission() throws Exception {
        mockMvc.perform(get("/api/v1/cases")
                        .header("X-User-Id", "2"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("El usuario no tiene el permiso requerido: caso.ver"));
    }

    @Test
    void shouldFilterCasesOutsideAuthenticatedScopeInList() throws Exception {
        mockMvc.perform(get("/api/v1/cases")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].id").value(100))
                .andExpect(jsonPath("$.items[0].folderCode").value("0100PZ"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.totalPages").value(1));
    }

    @Test
    void shouldReturnPaginationMetadataForCaseList() throws Exception {
        mockMvc.perform(get("/api/v1/cases")
                        .param("page", "0")
                        .param("size", "1")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(1))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(2));
    }

    @Test
    void shouldRejectWorkflowTransitionWhenCaseIsOutsideAuthenticatedScope() throws Exception {
        CaseWorkflowTransitionRequest request = new CaseWorkflowTransitionRequest(
                "tramite",
                "tramite.avanzar",
                "Intento fuera de sucursal",
                false
        );

        mockMvc.perform(post("/api/v1/cases/101/workflow/transitions")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("El usuario no tiene alcance para operar sobre esa organizacion/sucursal"));
    }

    @Test
    void shouldPersistWorkflowTransitionWhenUserHasPermissionAndScope() throws Exception {
        CaseWorkflowTransitionRequest request = new CaseWorkflowTransitionRequest(
                "tramite",
                "tramite.avanzar",
                "Avance manual",
                false
        );

        mockMvc.perform(post("/api/v1/cases/100/workflow/transitions")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk());

        Long currentStateId = jdbcTemplate.queryForObject(
                "SELECT estado_tramite_actual_id FROM casos WHERE id = ?",
                Long.class,
                100L
        );
        Integer historyEntries = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM caso_estado_historial WHERE caso_id = ? AND dominio_estado = ?",
                Integer.class,
                100L,
                "tramite"
        );

        org.junit.jupiter.api.Assertions.assertEquals(2L, currentStateId);
        org.junit.jupiter.api.Assertions.assertEquals(2, historyEntries);
    }

    private void seedVehiclesAndPeople() {
        jdbcTemplate.update(
                "INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                1L, "00000000-0000-0000-0000-000000001001", "fisica", "Ana", "Scope", "Ana Scope", "DNI", "12345678", "12345678", true
        );
        jdbcTemplate.update(
                "INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (?, ?, ?, ?, ?)",
                1L, "00000000-0000-0000-0000-000000002001", "AA123BB", "AA123BB", true
        );
    }

    private void seedCases() {
        jdbcTemplate.update(
                "INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, prioridad_codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                100L, "00000000-0000-0000-0000-000000003100", "0100PZ", 100L, 1L, 1L, 1L, 1L, 1L, false, 1L, 1L, 4L, "MEDIA"
        );
        jdbcTemplate.update(
                "INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, prioridad_codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                101L, "00000000-0000-0000-0000-000000003101", "0101PC", 101L, 1L, 1L, 2L, 1L, 1L, false, 1L, 1L, 4L, "ALTA"
        );
        jdbcTemplate.update(
                "INSERT INTO caso_estado_historial (caso_id, dominio_estado, estado_id, fecha_estado, usuario_id, automatico, motivo, detalle_json) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?)",
                100L, "tramite", 1L, 1L, false, "Estado inicial", "{}"
        );
        jdbcTemplate.update(
                "INSERT INTO caso_estado_historial (caso_id, dominio_estado, estado_id, fecha_estado, usuario_id, automatico, motivo, detalle_json) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?)",
                101L, "tramite", 1L, 1L, false, "Estado inicial", "{}"
        );
    }

    private void seedUsers() {
        jdbcTemplate.update(
                "INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                2L, "00000000-0000-0000-0000-000000000200", "sin-permisos", "sin-permisos@tallerzapata.local", "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", "Sin", "Permisos", true
        );
        jdbcTemplate.update(
                "INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                3L, "00000000-0000-0000-0000-000000000300", "operador-zapata", "operador-zapata@tallerzapata.local", "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", "Operador", "Sucursal", true
        );
        jdbcTemplate.update(
                "INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (?, ?, ?, ?, ?, ?)",
                3L, 3L, 2L, 1L, 1L, true
        );
    }

    private void seedWorkflowTransitions() {
        jdbcTemplate.update(
                "INSERT INTO workflow_transiciones (id, dominio, tipo_tramite_id, estado_origen_id, estado_destino_id, accion_codigo, requiere_permiso_codigo, automatica, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                9001L, "tramite", null, 1L, 2L, "tramite.avanzar", "workflow.transicionar", false, true
        );
        jdbcTemplate.update(
                "INSERT INTO workflow_transiciones (id, dominio, tipo_tramite_id, estado_origen_id, estado_destino_id, accion_codigo, requiere_permiso_codigo, automatica, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                9002L, "tramite", null, 2L, 3L, "tramite.cerrar", "workflow.transicionar", false, true
        );
    }
}
