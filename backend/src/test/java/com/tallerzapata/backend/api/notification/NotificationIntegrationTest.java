package com.tallerzapata.backend.api.notification;

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
class NotificationIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM notificaciones");
        jdbcTemplate.update("DELETE FROM movimiento_aplicaciones");
        jdbcTemplate.update("DELETE FROM movimiento_retenciones");
        jdbcTemplate.update("DELETE FROM movimientos_financieros");
        jdbcTemplate.update("DELETE FROM comprobantes_emitidos");
        jdbcTemplate.update("DELETE FROM documento_relaciones");
        jdbcTemplate.update("DELETE FROM documentos");
        jdbcTemplate.update("DELETE FROM egresos_vehiculo");
        jdbcTemplate.update("DELETE FROM ingreso_items");
        jdbcTemplate.update("DELETE FROM ingresos_vehiculo");
        jdbcTemplate.update("DELETE FROM turnos_reparacion");
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
        seedBaseData();
    }

    @Test
    void shouldCreateAndListNotification() throws Exception {
        mockMvc.perform(post("/api/v1/notifications")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new NotificationCreateRequest(3L, 100L, "TURNO_ASIGNADO", "Turno asignado", "Se te asigno un turno para el caso 0100PZ", "/cases/100", "caso", 100L))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(3))
                .andExpect(jsonPath("$.typeCode").value("TURNO_ASIGNADO"))
                .andExpect(jsonPath("$.read").value(false));

        mockMvc.perform(get("/api/v1/notifications")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Turno asignado"));
    }

    @Test
    void shouldListOnlyUnreadNotifications() throws Exception {
        mockMvc.perform(post("/api/v1/notifications")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new NotificationCreateRequest(3L, 100L, "PRESUPUESTO_APROBADO", "Presupuesto aprobado", "El presupuesto fue aprobado", null, null, null))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/notifications")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new NotificationCreateRequest(3L, null, "RECORDATORIO", "Recordatorio", "No olvides revisar el caso", null, null, null))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/notifications/unread")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void shouldMarkNotificationAsRead() throws Exception {
        String response = mockMvc.perform(post("/api/v1/notifications")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new NotificationCreateRequest(3L, 100L, "VEHICULO_LISTO", "Vehiculo listo", "El vehiculo esta listo para retirar", null, null, null))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long notificationId = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(put("/api/v1/notifications/{notificationId}/read", notificationId)
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.read").value(true))
                .andExpect(jsonPath("$.readAt").isNotEmpty());

        mockMvc.perform(get("/api/v1/notifications/unread")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void shouldCountUnreadNotifications() throws Exception {
        mockMvc.perform(post("/api/v1/notifications")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new NotificationCreateRequest(3L, null, "PAGO_REGISTRADO", "Pago registrado", "Se registro un pago", null, null, null))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/notifications/count-unread")
                        .header("X-User-Id", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(1));
    }

    @Test
    void shouldRejectInvalidTypeCode() throws Exception {
        mockMvc.perform(post("/api/v1/notifications")
                        .header("X-User-Id", "3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new NotificationCreateRequest(3L, null, "TIPO_INVALIDO", "Titulo", "Mensaje", null, null, null))))
                .andExpect(status().isConflict());
    }

    private void seedBaseData() {
        jdbcTemplate.update("INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 3L, "00000000-0000-0000-0000-000000000300", "operador", "operador@tallerzapata.local", "hash", "Olivia", "Operadora", true);
        jdbcTemplate.update("INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (?, ?, ?, ?, ?, ?)", 3L, 3L, 2L, 1L, 1L, true);
        jdbcTemplate.update("INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 10L, "00000000-0000-0000-0000-000000001010", "fisica", "Carlos", "Cliente", "Carlos Cliente", "DNI", "30111222", "30111222", true);
        jdbcTemplate.update("INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (?, ?, ?, ?, ?)", 10L, "00000000-0000-0000-0000-000000002010", "AB123CD", "AB123CD", true);
        jdbcTemplate.update("INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 100L, "00000000-0000-0000-0000-000000003100", "0100PZ", 100L, 1L, 1L, 1L, 10L, 10L, false, 1L, 1L, 4L, 7L, 9L, 11L, "MEDIA");
        jdbcTemplate.update("INSERT INTO caso_personas (id, caso_id, persona_id, rol_caso_codigo, vehiculo_id, es_principal, notas) VALUES (?, ?, ?, ?, ?, ?, ?)", 1L, 100L, 10L, "CLIENTE", null, true, null);
    }
}
