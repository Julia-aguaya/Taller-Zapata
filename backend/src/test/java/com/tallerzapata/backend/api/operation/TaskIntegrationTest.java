package com.tallerzapata.backend.api.operation;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TaskIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
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

        seedCases();
        seedUsers();
    }

    @Test
    void shouldCreateGeneralTaskAndListItByScope() throws Exception {
        OperationalTaskCreateRequest request = new OperationalTaskCreateRequest(
                null,
                1L,
                1L,
                "OPERACION",
                "AGENDA",
                "Llamar al cliente",
                "Confirmar turno",
                null,
                "MEDIA",
                null,
                3L,
                objectMapper.readTree("{\"channel\":\"phone\"}")
        );

        mockMvc.perform(post("/api/v1/tasks")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.organizationId").value(1))
                .andExpect(jsonPath("$.branchId").value(1))
                .andExpect(jsonPath("$.statusCode").value("PENDIENTE"));

        mockMvc.perform(get("/api/v1/tasks")
                        .header("X-User-Id", "3")
                        .param("assignedUserId", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].title").value("Llamar al cliente"));
    }

    @Test
    void shouldCreateCaseTaskAndResolveIt() throws Exception {
        OperationalTaskCreateRequest createRequest = new OperationalTaskCreateRequest(
                100L,
                null,
                null,
                "CASO",
                "REPARACION",
                "Subir fotos finales",
                "Antes del egreso",
                null,
                "ALTA",
                "EN_PROGRESO",
                3L,
                null
        );

        String response = mockMvc.perform(post("/api/v1/tasks")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(createRequest)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long taskId = objectMapper.readTree(response).get("id").asLong();

        OperationalTaskUpdateRequest updateRequest = new OperationalTaskUpdateRequest(
                "CASO",
                "REPARACION",
                "Subir fotos finales",
                "Completadas",
                null,
                "ALTA",
                "RESUELTA",
                3L,
                objectMapper.readTree("{\"uploaded\":true}")
        );

        mockMvc.perform(put("/api/v1/tasks/{taskId}", taskId)
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resolved").value(true))
                .andExpect(jsonPath("$.statusCode").value("RESUELTA"));

        Integer auditCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM auditoria_eventos WHERE caso_id = ? AND accion_codigo IN ('crear_tarea', 'actualizar_tarea')",
                Integer.class,
                100L
        );
        assertThat(auditCount).isEqualTo(2);
    }

    @Test
    void shouldRejectGeneralTaskOutsideUserScope() throws Exception {
        OperationalTaskCreateRequest request = new OperationalTaskCreateRequest(
                null,
                1L,
                2L,
                "OPERACION",
                "AGENDA",
                "No deberia crear",
                null,
                null,
                "MEDIA",
                null,
                null,
                null
        );

        mockMvc.perform(post("/api/v1/tasks")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("El usuario no tiene alcance para operar sobre esa organizacion/sucursal"));
    }

    private void seedCases() {
        jdbcTemplate.update(
                "INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                10L, "00000000-0000-0000-0000-000000001010", "fisica", "Carlos", "Cliente", "Carlos Cliente", "DNI", "30111222", "30111222", true
        );
        jdbcTemplate.update(
                "INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (?, ?, ?, ?, ?)",
                10L, "00000000-0000-0000-0000-000000002010", "AB123CD", "AB123CD", true
        );
        jdbcTemplate.update(
                "INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                100L, "00000000-0000-0000-0000-000000003100", "0100PZ", 100L, 1L, 1L, 1L, 10L, 10L, false, 1L, 1L, 4L, 7L, 9L, 11L, "MEDIA"
        );
    }

    private void seedUsers() {
        jdbcTemplate.update(
                "INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                3L, "00000000-0000-0000-0000-000000000300", "operador", "operador@tallerzapata.local", "hash", "Olivia", "Operadora", true
        );
        jdbcTemplate.update(
                "INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (?, ?, ?, ?, ?, ?)",
                3L, 3L, 2L, 1L, 1L, true
        );
    }
}
