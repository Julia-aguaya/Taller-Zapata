package com.tallerzapata.backend.api.casefile;

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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CaseWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM auditoria_eventos");
        jdbcTemplate.update("DELETE FROM caso_estado_historial");
        jdbcTemplate.update("DELETE FROM workflow_transiciones");
        jdbcTemplate.update("DELETE FROM caso_relaciones");
        jdbcTemplate.update("DELETE FROM caso_siniestro");
        jdbcTemplate.update("DELETE FROM caso_vehiculos");
        jdbcTemplate.update("DELETE FROM caso_personas");
        jdbcTemplate.update("DELETE FROM casos");
        jdbcTemplate.update("DELETE FROM vehiculos");
        jdbcTemplate.update("DELETE FROM personas");
        jdbcTemplate.update("DELETE FROM usuario_roles WHERE usuario_id <> 1");
        jdbcTemplate.update("DELETE FROM usuarios WHERE id <> 1");

        seedVehiclesAndPeople();
        seedCases();
        seedUsers();
        seedWorkflowTransitions();
    }

    @Test
    void shouldReturnHistoryOrderedByStateDateDesc() throws Exception {
        mockMvc.perform(get("/api/v1/cases/100/workflow/history")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].domain").value("tramite"))
                .andExpect(jsonPath("$[0].stateCode").value("EN_TRAMITE"))
                .andExpect(jsonPath("$[0].reason").value("Avance inicial"))
                .andExpect(jsonPath("$[1].stateCode").value("INGRESADO"));
    }

    @Test
    void shouldTransitionCaseAndAppendHistoryAndAudit() throws Exception {
        CaseWorkflowTransitionRequest request = new CaseWorkflowTransitionRequest(
                "tramite",
                "tramite.avanzar",
                "Pasa a en tramite",
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
        Integer transitionHistoryEntries = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM caso_estado_historial WHERE caso_id = ? AND dominio_estado = ? AND estado_id = ?",
                Integer.class,
                100L,
                "tramite",
                2L
        );
        Integer auditEntries = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo = 'transicionar_estado'",
                Integer.class,
                100L
        );

        assertThat(currentStateId).isEqualTo(2L);
        assertThat(transitionHistoryEntries).isEqualTo(2);
        assertThat(auditEntries).isEqualTo(1);
    }

    @Test
    void shouldTransitionPaymentDomainAndUpdateCaseCache() throws Exception {
        CaseWorkflowTransitionRequest request = new CaseWorkflowTransitionRequest(
                "pago",
                "pago.marcar_pagado",
                "Pago recibido",
                false
        );

        mockMvc.perform(post("/api/v1/cases/100/workflow/transitions")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk());

        Long currentStateId = jdbcTemplate.queryForObject(
                "SELECT estado_pago_actual_id FROM casos WHERE id = ?",
                Long.class,
                100L
        );
        assertThat(currentStateId).isEqualTo(8L);
    }

    @Test
    void shouldRejectLegalTransitionWhenRuleIsNotSatisfied() throws Exception {
        CaseWorkflowTransitionRequest request = new CaseWorkflowTransitionRequest(
                "legal",
                "legal.iniciar",
                "Intenta abrir legal",
                false
        );

        mockMvc.perform(post("/api/v1/cases/100/workflow/transitions")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("La transicion no cumple la regla configurada"));
    }

    @Test
    void shouldRejectTransitionWithoutFineGrainedPermission() throws Exception {
        jdbcTemplate.update("DELETE FROM rol_permisos WHERE rol_id = ? AND permiso_id = ?", 2L, 12L);

        CaseWorkflowTransitionRequest request = new CaseWorkflowTransitionRequest(
                "documentacion",
                "documentacion.completar",
                "Completa legajo",
                false
        );

        mockMvc.perform(post("/api/v1/cases/100/workflow/transitions")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("El usuario no tiene el permiso requerido: workflow.documentacion.completar"));
    }

    @Test
    void shouldTransitionWhenDslV2AllAndInConditionsAreSatisfied() throws Exception {
        CaseWorkflowTransitionRequest request = new CaseWorkflowTransitionRequest(
                "documentacion",
                "documentacion.completar",
                "cierre expediente documental",
                false
        );

        mockMvc.perform(post("/api/v1/cases/100/workflow/transitions")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk());

        Long currentStateId = jdbcTemplate.queryForObject(
                "SELECT estado_documentacion_actual_id FROM casos WHERE id = ?",
                Long.class,
                100L
        );
        assertThat(currentStateId).isEqualTo(10L);
    }

    @Test
    void shouldRejectTransitionWhenActionIsInvalidForCurrentState() throws Exception {
        CaseWorkflowTransitionRequest request = new CaseWorkflowTransitionRequest(
                "tramite",
                "tramite.inexistente",
                "No deberia pasar",
                false
        );

        mockMvc.perform(post("/api/v1/cases/100/workflow/transitions")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("No existe una transicion valida para esa accion"));
    }

    @Test
    void shouldListAvailableWorkflowActionsForCurrentState() throws Exception {
        mockMvc.perform(get("/api/v1/cases/100/workflow/actions")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caseId").value(100))
                .andExpect(jsonPath("$.actions.length()").value(3));

        mockMvc.perform(get("/api/v1/cases/100/workflow/actions")
                        .param("domain", "tramite")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actions.length()").value(1))
                .andExpect(jsonPath("$.actions[0].actionCode").value("tramite.avanzar"));
    }

    @Test
    void shouldHideUnavailableWorkflowActionsWhenPermissionIsMissing() throws Exception {
        jdbcTemplate.update("DELETE FROM rol_permisos WHERE rol_id = ? AND permiso_id = ?", 2L, 11L);

        mockMvc.perform(get("/api/v1/cases/100/workflow/actions")
                        .param("domain", "pago")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actions.length()").value(0));
    }

    @Test
    void shouldRejectHistoryWhenCaseIsOutsideAuthenticatedScope() throws Exception {
        mockMvc.perform(get("/api/v1/cases/101/workflow/history")
                        .header("X-User-Id", "3"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("El usuario no tiene alcance para operar sobre esa organizacion/sucursal"));
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
                "INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                100L, "00000000-0000-0000-0000-000000003100", "0100PZ", 100L, 1L, 1L, 1L, 1L, 1L, false, 1L, 1L, 4L, 7L, 9L, 11L, "MEDIA"
        );
        jdbcTemplate.update(
                "INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                101L, "00000000-0000-0000-0000-000000003101", "0101PC", 101L, 1L, 1L, 2L, 1L, 1L, false, 1L, 1L, 4L, 7L, 9L, 11L, "ALTA"
        );
        jdbcTemplate.update(
                "INSERT INTO caso_estado_historial (id, caso_id, dominio_estado, estado_id, fecha_estado, usuario_id, automatico, motivo, detalle_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                1001L, 100L, "tramite", 1L, "2026-04-20 09:00:00", 1L, false, "Estado inicial", "{}"
        );
        jdbcTemplate.update(
                "INSERT INTO caso_estado_historial (id, caso_id, dominio_estado, estado_id, fecha_estado, usuario_id, automatico, motivo, detalle_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                1002L, 100L, "tramite", 2L, "2026-04-20 10:00:00", 1L, false, "Avance inicial", "{}"
        );
    }

    private void seedUsers() {
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
                "INSERT INTO workflow_transiciones (id, dominio, tipo_tramite_id, estado_origen_id, estado_destino_id, accion_codigo, requiere_permiso_codigo, automatica, regla_json, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                1L, "tramite", null, 1L, 2L, "tramite.avanzar", "workflow.tramite.avanzar", false, null, true
        );
        jdbcTemplate.update(
                "INSERT INTO workflow_transiciones (id, dominio, tipo_tramite_id, estado_origen_id, estado_destino_id, accion_codigo, requiere_permiso_codigo, automatica, regla_json, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                2L, "tramite", null, 2L, 3L, "tramite.cerrar", "workflow.tramite.cerrar", false, null, true
        );
        jdbcTemplate.update(
                "INSERT INTO workflow_transiciones (id, dominio, tipo_tramite_id, estado_origen_id, estado_destino_id, accion_codigo, requiere_permiso_codigo, automatica, regla_json, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                3L, "pago", null, 7L, 8L, "pago.marcar_pagado", "workflow.pago.marcar_pagado", false, null, true
        );
        jdbcTemplate.update(
                "INSERT INTO workflow_transiciones (id, dominio, tipo_tramite_id, estado_origen_id, estado_destino_id, accion_codigo, requiere_permiso_codigo, automatica, regla_json, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                30L, "documentacion", null, 9L, 10L, "documentacion.completar", "workflow.documentacion.completar", false, "{\"all\":[{\"field\":\"priorityCode\",\"op\":\"IN\",\"value\":[\"ALTA\",\"MEDIA\"]},{\"not\":{\"field\":\"reason\",\"op\":\"CONTAINS\",\"value\":\"bloqueado\"}}]}", true
        );
        jdbcTemplate.update(
                "INSERT INTO workflow_transiciones (id, dominio, tipo_tramite_id, estado_origen_id, estado_destino_id, accion_codigo, requiere_permiso_codigo, automatica, regla_json, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                4L, "legal", null, 11L, 12L, "legal.iniciar", "workflow.legal.iniciar", false, "{\"field\":\"referenced\",\"op\":\"EQ\",\"value\":true}", true
        );
    }
}
